require('dotenv').config();

module.exports = function(eleventyConfig) {

  
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