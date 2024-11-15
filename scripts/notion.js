const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { AssetCache } = require("@11ty/eleventy-fetch");
const process_images=require('./process-images.js');
const slugify = require('slugify');
require('dotenv').config();


let databases=[
    {name:"pages",id:"b559cf69cf7d4340b25b83814f44d423",options:{sort_prop:'order'}},
    {name: "projects",id:"36cbc31b97c74b31a382afdcae2206ba"},
]