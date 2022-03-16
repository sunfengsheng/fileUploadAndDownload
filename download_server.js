var koa = require('koa')
var path = require('path');
var KoaBody = require('koa-body');
var Router = require('koa-router');
var cors = require('koa2-cors');
var fs = require('fs');
const send = require('koa-send');

var router = new Router()
const app = new koa()
app.use(cors());

const uploadChunkPath = path.resolve(__dirname,'./data')
app.use(KoaBody({
  multipart:true, // 支持文件上传 
  formidable: {
    //设置文件的默认保存目录，不设置则保存在系统临时目录下  os
    uploadDir: uploadChunkPath
  },
}))

router.get('/download',async (ctx)=>{
    console.log(ctx.request.query);
    ctx.response.body = 'wqwqwqq';
    const path = `file/Kylin-Desktop-V10-SP2-General-RC5-Build03-2201-4-x86_64.iso`;        
    ctx.attachment(path);    
    await send(ctx, path);
  })

async function submitDownload(url, file) {

}

function blobToFormData(){

}

app.use(router.routes());
app.listen(8888, () => {
    console.log("服务器已启动，http://localhost:3000");
})