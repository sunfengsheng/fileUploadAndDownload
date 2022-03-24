var koa = require('koa')
var path = require('path');
var KoaBody = require('koa-body');
var Router = require('koa-router');
var cors = require('koa2-cors');
const send = require('koa-send');
var fs = require('fs');


var router = new Router()
const app = new koa()
var m_Count = 0
var port = 8888
app.use(cors());

var uploadChunkPath = path.resolve(__dirname,'./data')
app.use(KoaBody({
  multipart:true, // 支持文件上传 
  formidable: {
    //设置文件的默认保存目录，不设置则保存在系统临时目录下  os
    uploadDir: uploadChunkPath
  },
}))


router.post('/upload',ctx=>{
  console.log(ctx.request.body);
  if(ctx.request.body.type === 'upload'){
          const {index,token,name,count} = ctx.request.body
          m_Count++
          const chunkFile = ctx.request.files.chunk
          const chunkName = chunkFile.path.split('/').pop()
          // var uploadChunkPath = token + '-data'
          // fs.exists(uploadChunkPath, function(exists) {
          //   if(!exists){
          //     fs.mkdirSync(uploadChunkPath)
          //   }
          // });
          renameFile(uploadChunkPath,chunkName,`${name}-${index}-${token}`)

          if(m_Count==count){
            mergeChunkFile(name,uploadChunkPath,count,token,'./data')
            ctx.body = "token:"+token
            console.log('upload & merge is finish');
            m_Count=0
          }else{
            ctx.body = index
            console.log('upload is finish');
          }
          
    }else{
      ctx.body = "unkown type"
    }
})

const mergeChunkFile = (fileName,chunkPath,chunkCount,fileToken,dataDir)=>{
    // dataDir = "./file"
    fs.mkdirSync(fileToken)
    dataDir = fileToken
    //如果chunkPath 不存在 则直接结束
    if(!fs.existsSync(chunkPath)) return 
    const dataPath = path.join(__dirname,dataDir,fileName);
    var writeStream = fs.createWriteStream(dataPath); 
    var mergedChunkNum = 0
    return mergeCore()
  	//闭包保存非递归数据
    function mergeCore(){
      	//结束标志为已合并数量大于总数（mergedChunkNum从0开始）
        if (mergedChunkNum >= chunkCount) return
        const curChunk = path.resolve(chunkPath,`${fileName}-${mergedChunkNum}-${fileToken}`)
        const curChunkReadStream = fs.createReadStream(curChunk);
        //将readStream 写入 writeStream
        curChunkReadStream.pipe(writeStream, { end: false }); //end = false 则可以连续给writeStream 写数据
        curChunkReadStream.on("end", () => {
            //readStream 传输结束 则 递归 进行下一个文件流的读写操作
            fs.unlinkSync(curChunk) //删除chunkFile
            mergedChunkNum += 1
            mergeCore();
        });
    }
}

//文件重命名
function renameFile(dir,oldName,newName){
  const oldPath = path.resolve(dir,oldName)
  const newPath = path.resolve(dir,newName)
  fs.renameSync(oldPath,newPath)
}

router.get('/download',async (ctx)=>{

  ctx.res.setHeader('Content-Type', 'text/html;charset=UTF-8')
  ctx.res.setHeader("Access-Control-Expose-Headers","Content-Disposition")

  console.log(ctx.query.token);
  var token = ctx.query.token
  var readDir = fs.readdirSync(ctx.query.token);
  var fileName = readDir[0]

  ctx.res.setHeader("FileName", encodeURI(fileName, "UTF-8")); 
  const path = token+'/'+fileName;        
  ctx.attachment(path);    
  await send(ctx, fileName,{ root: __dirname + '/' +token });
})


router.get('/test',async (ctx)=>{
  ctx.res.setHeader('Content-Type', 'text/html;charset=UTF-8')
  ctx.res.setHeader("Access-Control-Expose-Headers","Content-Disposition")
  console.log('fsdfsdfsfs')
  console.log(ctx.query.token);
  var token = ctx.query.token
  var readDir = fs.readdirSync(ctx.query.token);
  var fileName = readDir[0]
  ctx.res.setHeader("FileName", encodeURI(fileName, "UTF-8")); 
  let requestUrl = ctx.request.originalUrl;
  console.log(requestUrl)
  let filePath = path.resolve(__dirname + '/' + token + '/' + decodeURI(fileName));
  console.log(filePath)
  console.log(ctx.headers)
  let resHred = readFile(ctx.headers.range, filePath);
  console.log(ctx.headers['content-range'])

  ctx.status = resHred.code
  ctx.set(resHred.head);
  let stream = fs.createReadStream(filePath, resHred.code == 200 ? {} : { start: resHred.start, end: resHred.end });
  stream.pipe(ctx.res);
  ctx.respond = false;
  return

})





router.get('/',async (ctx)=>{
  ctx.res.setHeader("Access-Control-Expose-Headers","Content-Disposition")
  ctx.res.setHeader('Content-Type', 'text/html;charset=UTF-8')
  const html = fs.readFileSync("./upload.html", "binary");
  ctx.body = html;
})
router.get('/upload.js',async (ctx)=>{
  ctx.res.setHeader("Access-Control-Expose-Headers","Content-Disposition")
  ctx.res.setHeader('Content-Type', 'text/html;charset=UTF-8')
  const html = fs.readFileSync("./upload.js", "binary");
  ctx.body = html;
})

router.get('/download.js',async (ctx)=>{
  ctx.res.setHeader("Access-Control-Expose-Headers","Content-Disposition")
  ctx.res.setHeader('Content-Type', 'text/html;charset=UTF-8')
  const html = fs.readFileSync("./download.js", "binary");
  ctx.body = html;
})




app.use(router.routes());
app.listen(port, () => {
  console.log("服务器已启动，http://localhost:%s",port);
})


function readFile(range, filePath, chunkSize = 499999 * 2) {
  //mime类型
  const mime = {
      "css": "text/css",
      "gif": "image/gif",
      "html": "text/html",
      "ico": "image/x-icon",
      "jpeg": "image/jpeg",
      "jpg": "image/jpeg",
      "js": "text/javascript",
      "json": "application/json",
      "pdf": "application/pdf",
      "png": "image/png",
      "svg": "image/svg+xml",
      "swf": "application/x-shockwave-flash",
      "tiff": "image/tiff",
      "txt": "text/plain",
      "mp3": "audio/mp3",
      "wav": "audio/x-wav",
      "wma": "audio/x-ms-wma",
      "wmv": "video/x-ms-wmv",
      "xml": "text/xml",
      "mp4": "video/mp4"
  };
  // 获取后缀名
  let ext = path.extname(filePath);
  ext = ext ? ext.slice(1) : 'unknown';
  //未知的类型一律用"text/plain"类型
  let contentType = mime[ext.toLowerCase()];

  //建立流对象，读文件
  let stat = fs.statSync(filePath)
  let fileSize = stat.size;
  let head = {
      code: 200,
      head: {
          'Content-Length': fileSize,
          'content-type': contentType,
      }

  };
  if (range) {
      // 大文件分片
      let parts = range.replace("bytes=", "").split("-");
      console.log(parts)
      let start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : start + chunkSize;
      end = end > fileSize - 1 ? fileSize - 1 : end;
      chunkSize = (end - start) + 1;
      head = {
          code: 206,
          filePath,
          start,
          end,
          head: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'content-type': contentType,
              'Content-Length': chunkSize,
              'Accept-Ranges': 'bytes'
          }
      }
      console.log(head)

  }
  return head;
}