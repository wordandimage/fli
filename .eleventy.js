require('dotenv').config();
const marked = require('marked');
marked.use({mangle: false,headerIds: false});

module.exports = function(eleventyConfig) {
  


  eleventyConfig.addDataExtension("md", contents => {html:marked.parse(contents)});

  eleventyConfig.addNunjucksFilter('find_post',function(posts, title){

      let match=posts.find( (post)=>{
        // console.log('query:',title,'\nname:',post.data.title,'\n----------------')
        return post.data.title==title;
      } )

      return match;
  })

  eleventyConfig.addNunjucksFilter( "env", function(value) {    
    return process.env[value]
  });

  eleventyConfig.addNunjucksFilter( "notion_data_find", function(array,property,value) {   
    return array.find(item=>item.properties[property].value==value);
  });

  eleventyConfig.addNunjucksFilter( "notion_data_find_in_select", function(array,property,value) {   
    return array.find(item=>item.properties[property].value.includes(value));
  });

  eleventyConfig.addNunjucksFilter( "console_debug", function(value,prefix) {    
    if(prefix) console.log(prefix,value);
    else console.log(value);
    return value;
  });

  eleventyConfig.addNunjucksFilter( "md", function(value) {    
    var result;
      try {
        result = marked.parse(value)
        return result;
      } catch (e) {
        return "";
      }
  });



  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addTemplateFormats('md,njk,css,js')

    // Return your Object options:
    return {
      dir: {
        input: "input",
        output: "_site"
      }
    }
  };