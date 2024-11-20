const sharp = require('sharp');
const stream=require('stream');
const fs = require('fs');
const https = require('https');

let aspect_ratios={};

let sizes={
    sm:500,
    md:1000,
    lg:1500,
    xl:2500
}



let image_root="assets/images"

let get_path=(name,{size,ext,raw=false})=>raw?`${image_root}/${name}.${ext}`
                                           :`${image_root}/img@@${name}@@${size}.${ext}`;


function get_all_formats_for_size(image,size){
    let jpg=get_path(image.filename,{size,ext:'jpg'});
    let webp=get_path(image.filename,{size,ext:'webp'});

    return {jpg,webp}
}


module.exports=async function process_images(file_processing_queue=[]){
    console.log(`   processing ${file_processing_queue.length} valid files...`)
    let new_counter=0;

    for(let file of file_processing_queue){
        if(file.file_type=='image'){
            let size_missing=false;
            // check if any of the sizes don't exist
            for(let size of file?.sizes || []){
                file.filename = file.name.replace(/\.[^/.]+$/, '');

                let path=get_all_formats_for_size(file,size);
                let exists=fs.existsSync(path.jpg)&&fs.existsSync(path.webp);
                if(!exists) size_missing=true;
            }

            if(size_missing){
                console.log(`      downloading and resizing ${file.name}...`);
                new_counter++;
                await load_image(file);
                // if at least one does not exist, redowload and process the image
            }

            let rendition=get_all_formats_for_size(file,file?.sizes[0]);
            let aspect_ratio=await sharp(rendition.jpg).metadata().then((meta)=>{return meta?.height/meta?.width})
            aspect_ratios["img-"+file.name]=aspect_ratio;
        }else{
            // just download it directly
            let path=get_path(file.name,{ext:file.extension,raw:true})
            let exists=fs.existsSync(path);
            if(!exists){
                let new_file=fs.createWriteStream(path);
                console.log(`      downloading ${file.name}.${file.extension}...`);
                await new Promise((resolve)=>{
                    https.get(file.url, function(response) {
                        response.pipe(new_file);
                        new_file.on("finish", () => {
                            new_file.close();
                            resolve();
                        });
                    });
                })
                new_counter++;
            }
        }
        
     
    }

    console.log(`   processed ${new_counter} new files.`);
    return {
        aspect_ratios
    }
    // return true;
}



function load_image(image){

    return new Promise(async (resolve) => {

        let promises=[];
        const sharpStream = sharp({ failOn: 'none' });
        for(let size of image.sizes){
            let path=get_all_formats_for_size(image,size);
            promises.push(
                sharpStream
                    .clone()
                    .resize({width:sizes[size]})
                    .toFormat('jpg')
                    .toFile(path.jpg)
            );

            promises.push(
                sharpStream
                    .clone()
                    .resize({width:sizes[size]})
                    .toFormat('webp')
                    .toFile(path.webp)
            );
        }

        const {body}=await fetch(image.url);
        let readableStream=stream.Readable.fromWeb(body)
        readableStream.pipe(sharpStream);

        Promise.all(promises)
        .then(res => { resolve(true) })
        
    })
}

