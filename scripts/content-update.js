const fs = require('fs');

bump_content_version();

function bump_content_version(){
    const obj=JSON.parse(fs.readFileSync('./content.json'));
    if(!obj.edited){
        console.log('Updating content version. Ready to push.')
        obj.edited=true;
        obj.version=obj.version+1;
        fs.writeFileSync('./content.json',JSON.stringify(obj))
    }else{
        console.log('Version already updated. Ready to push.')
    }
    console.log(obj);
}