const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { AssetCache } = require("@11ty/eleventy-fetch");
const process_images=require('./process-images.js');
const slugify = require('slugify');
require('dotenv').config();

let secret=process.env.NOTION_TOKEN;
const notion = new Client({
    auth: secret
})
const n2m = new NotionToMarkdown({ notionClient: notion });
const delay = (t) => new Promise(resolve => setTimeout(resolve, t));

let databases=[
    {name:"pages",id:"b559cf69cf7d4340b25b83814f44d423",options:{sort_prop:'order'}},
    {name: "projects",id:"36cbc31b97c74b31a382afdcae2206ba"},
]

let file_processing_queue=[];

let extension=(filename)=>{
    let find_extension=filename.match(/\.[^/.]+$/)
    let fExtension = find_extension.length>0?find_extension[0]:'invalid';
    let acceptableExt = ['.jpg', '.png', '.jpeg', '.webp'];
    return {
        value:fExtension,
        acceptable:fExtension && acceptableExt.includes(fExtension.toLowerCase())
    }
}


async function fetch_database(database_id,{include_content=true,sort_prop}={}){
    let has_more=true;
    let next_cursor;

    // holds rows from API responses
    let results=[];

    let counter=1;

    // fetching each page in database
    while(has_more){
        console.log('      loading page '+counter);
        counter++;
        let req_obj={
            database_id
        };
        if(next_cursor) req_obj.start_cursor=next_cursor;
        if(sort_prop) req_obj.sorts=[{property:sort_prop,direction:"ascending"}];
        let data=await notion.databases.query(req_obj)
        results=[...results,...data.results];
        has_more=data.has_more;
        if(has_more){
            next_cursor=data.next_cursor;
            await delay(1000);
        }
    }


    // transforming notion data for use by the nunjucks template
    results=results.map(a=>{
        let properties={};
      
        for(let prop of Object.keys(a.properties)){
            let b=a.properties[prop];
            switch(b.type){
                case 'title':
                    properties[prop]= {
                        type:'title',
                        value:b.title[0]?.plain_text || ''
                    }
                    break;
                case 'number':
                    properties[prop]=  {
                        type:'number',
                        value:b.number
                    }
                    break;
                case 'unique_id':
                    properties[prop]=  {
                        type:'number',
                        value:b.unique_id.number
                    }
                    break;
                case 'select':
                    properties[prop]=  {
                        type:'select',
                        single:true,
                        value:[b.select?.name || '']
                    }
                    break;
                case 'rich_text':
                    properties[prop]=  {
                        type:'rich_text',
                        value:b.rich_text
                    }
                    break;
                case 'files':
                    
                    let input_file_array=b.files;

                    let output_file_array=[];

                    for(let file of input_file_array){
                        
                        let ext=file.type=='file'?extension(file.name):{};
                        let name=slugify((file.name || '').replace(/\.[^/.]+$/, ''));
                        if(file.type=='file'&&ext.acceptable){
                            // save to array of file data for this database cell
                            output_file_array.push({
                                type:'image',
                                name
                            })

                            // add to queue to download and process images as needed
                            file_processing_queue.push({
                                file_type:'image',
                                url:file.file.url,
                                name,
                                sizes:['sm','md','lg','xl']
                            })

                       
                        }else if(file.type!=='external'){
                            // save to array of file data for this database cell
                            output_file_array.push({
                                type:'attachment',
                                extension:ext.value.replace('.',''),
                                name
                            })

                            // add to queue to download (no processing for non-images)
                            file_processing_queue.push({
                                file_type:'attachment',
                                extension:ext.value.replace('.',''),
                                url:file.file.url,
                                name
                            })
                        }else{
                            // save link to array
                            output_file_array.push({
                                type:'embed',
                                url:file.external.url
                            })
                        }
                        
                    }
                 
                    properties[prop]=  {
                        type:'files',
                        value:output_file_array
                    }
                    break;
                case 'url':
                    let urlval=b[b.type];
                    if(!urlval.includes('http://')&&!urlval.includes('https://')&&!urlval.includes('mailto:')) urlval='https://'+urlval;
                    properties[prop]=  {
                        type:b.type,
                        value:urlval
                    }
                    break;
                case 'multi_select':
                    properties[prop]=  {
                        type:b.type,
                        value:b.multi_select?.map(a=>a.name)
                    }
                    break;
                case 'date':
                    
                    let {start,end} = b.date;

                    let day_only=(d)=>{
                        if(!d) return d;
                        else return d.split('T')[0]
                    }

                    properties[prop]=  {
                        type:b.type,
                        value:{start:day_only(start),end:day_only(end)}
                    }
                    break;
                default:
                    properties[prop]=  {
                        type:b.type,
                        value:b[b.type]
                    }
            }
        }
  
        return {
            item_id:a.id,
            properties
        }
    })

    if(include_content){
        for(let item of results){
            console.log(`         loading ${item.properties.title.value} content`)
            let mdcontent=await fetch_parse_block_content(item.item_id);

            await delay(500);
            
            item.mdcontent=mdcontent
        }
        
    }
    
    return results;
}

// recursively load the content of a block
async function fetch_parse_block_content(block_id){
    let has_more=true;
    let next_cursor;

    // hold fetched content from inside this block
    let results=[];

    // fetch the top-level blocks
    while(has_more){
        let req_obj={
            block_id,
            page_size: 100,
        };
        if(next_cursor) req_obj.start_cursor=next_cursor;
        let data=await notion.blocks.children.list(req_obj)
        results=[...results,...data.results];
        has_more=data.has_more;
        if(has_more){
            next_cursor=data.next_cursor;
            await delay(500);
        }
    }

    let content=[];
    
    // process block content to get into shape needed by page templates
    for(let block of results){
        
        let item;

        if(block.type=='image'){
            // images!
            let name=slugify(block.id.replace(/\.[^/.]+$/, ''))
            
            item={
                type:'image',
                value:{
                    name,
                    options:'medium',
                    // get image caption if it exists
                    // process links in rich text
                    caption:block.image.caption.map(a=>{
                        if(a.href){
                            return `[${a.plain_text}](${a.href})`
                        }else{
                            return a.plain_text;
                        }
                    }).join('')
                }
            }

            file_processing_queue.push({
                archive_type:'standalone',
                file_type:'image',
                url:block.image.file.url,
                name,
                sizes:['md','lg']
            })
        }else if(block.type=='callout'){
            // callout blocks give us a way of creating custom block types
            // such as image galleries and different image sizes
            let items=[];
            
            let valid_custom_types=['gallery','image'];

            // parses the first line of the callout as a command, e.g. "IMAGE:LARGE" -> ["image","large"]
            let config=block.callout.rich_text[0]?.plain_text?.toLowerCase()?.split(':')?.map(a=>a.trim()) || []
            let type=config[0];
            
            // gets the images or any other content inside this block
            if(block.has_children){
                await delay(500);
                items=await fetch_parse_block_content(block.id)
                
            }

            // add a default option
            if(config.length==1) config.push('large')

            // set item to custom block type with options and children
            if(valid_custom_types.includes(type)) {
                let options=config?.slice(1);

                item=type!=='image'?{
                    type,
                    value:{
                        options,
                        items
                    }
                }:{
                    type,
                    value:{
                        ...items[0].value,
                        options
                    }
                }

            }
        }else if(block.type=='bulleted_list_item'){
            // parse notion-flavored rich text in bullet
            let n2m_output=await n2m.blockToMarkdown(block);
            
            let list_item={
                type:'list',
                value:{
                    text:n2m_output
                }
                
            }

            if(block.has_children){
                await delay(500);
                // get nested list content
                let ul=await fetch_parse_block_content(block.id)
                if(ul) list_item.value.items=ul[0].value.items
            } 

            // if the previous item was a list, just ignore the white space and add these items there
            if(content.at(-1)?.type=='list') content.at(-1).value.items.push(list_item)
            else{
                // create a new list block
                item={
                    type:'list',
                    value:{items:[list_item]}
                }
            }

        }else{
            // if it’s regular text, a heading, or anything we don’t recognize
            // process it using the library default settings
            let n2m_output=await n2m.blockToMarkdown(block)
            item={
                type:block.type,
                value:n2m_output
            };
        }
        
        if(item) content.push(item);
        
    }
    
    return content;
}

module.exports = async function load_data({do_image_processing=false}={}){
    console.log('loading notion data...')
  
    let data={};
    
    for(let database of databases){
        console.log(`   loading ${database.name}`)
        let result=await fetch_database(database.id,database.options);
        data[database.name]=result;
    }

    console.log('   compiling project metadata')
    let project_metadata={event_types:[],tags:[]};
    for(let project of data.projects){
        // TK
        
    }

    let cms={
        ...data,
        project_metadata
    };
    
    if(do_image_processing){
        console.log('downloading and processing new images...')
        let img_data=await process_images(file_processing_queue);
        let img_cache = new AssetCache("img_data");
        img_cache.save(img_data, "json");
    }

    return cms;
}