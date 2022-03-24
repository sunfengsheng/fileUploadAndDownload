
// var ip = "http://39.96.14.155"
var ip = "http://127.0.0.1"
var port = ":8888"
//提交数据
const UPLOAD_URL = ip+port+"/upload";

var m_Count = 0
var progress1

function uploadclick() {
    submitUpload(UPLOAD_URL, getElFile("input#upload"));
}

  //主体上传功能
async function submitUpload(url, file) {
    const CHUNKSIZE =  4 * 1024 * 1024; // 1M
    const TOKEN = Date.now();
    //切割数组
    const chunkList = sliceFile(file, CHUNKSIZE);
    //创建formdata 并上传
    console.log(file.name);
    progress1 = document.getElementById("uploadProgress")
    progress1.setAttribute("max",chunkList.length)
    console.log('====================================',chunkList.length,progress1.max)
    let promiseList = createChunkPromiseList(chunkList, file.name, TOKEN);
    //并发控制 上传
    let a = await createLimitPromise(8, promiseList)
}


  //并发控制 
function createLimitPromise(limitNum, promiseListRaw) {
    let resArr = [];
    let handling = 0;
    let resolvedNum = 0;
    let promiseList = [...promiseListRaw]
    let runTime =  promiseListRaw.length
  
    return new Promise(resolve => {
      //并发执行limitNum 次
      for (let i = 1; i <= limitNum; i++) {
        run();
      }
  
      function run() {
         if(!promiseList.length) return 
          handling += 1;
          console.log("cur handling:" + handling)
          handle(promiseList.shift())
            .then(res => {
              resArr.push(res);
            })
            .catch(e => {
              //ignore
              console.log("catch error");
            })
            .finally(() => {
              handling -= 1;
              resolvedNum += 1;
              console.log(`resolvedNum : ${resolvedNum}`);
              if(resolvedNum === runTime){
                resolve(resArr)
              }
              run();
            });
      }
      function handle(promise) {
        return new Promise((resolve, reject) => {
          promise.then(res => resolve(res)).catch(e => reject(e));
        });
      }
    });
  }
  
  //分片二进制数据
  function sliceFile(file, chunkSize) {
    let chunkList = [];
    let start = 0;
    let end = chunkSize;
    while (true) {
      let curChunk = file.slice(start, end);
      if (!curChunk.size) break;
      chunkList.push(curChunk);
      start += chunkSize;
      end = start + chunkSize;
    }
    return chunkList;
  }
  
  //获取HTML 中的file对象
  function getElFile(selector) {
    return document.querySelector(selector).files[0];
  }
  
  //chunkList => formdata list => PromiseList
  //切片数组 封装成 http 请求
  function createChunkPromiseList(chunkList, name, TOKEN) {
    return chunkList
      .map((chunk, index) => {
        console.log(chunk);
        let formdata = new FormData();
        formdata.append("type", "upload");
        formdata.append("name", name);
        formdata.append("token", TOKEN);
        formdata.append("chunk", chunk);
        formdata.append("index", index);
        formdata.append("count", chunkList.length);
        return formdata;
      })
      .map(formdata => {
        var request = new XMLHttpRequest();
        request.open("POST", UPLOAD_URL,true);
        request.send(formdata);
        request.onreadystatechange=function()
          {
            if(request.readyState === XMLHttpRequest.DONE && request.status === 200) {
              console.log(request.responseText)
              if(request.responseText.includes("token")){
                var pin = request.responseText.replace('token:','')
                console.log("---------------",pin)
                progress1.value=0
                m_Count=0
                alert(pin);
              }else{
                m_Count++
                console.log("------------------------",m_Count)
                progress1.value=m_Count
              }
            }
          }
      });
  }
  
  var convert_FormData_to_json = function (formData) {
    var objData = {};
    
    for (var entry of formData.entries()){
        objData[entry[0]] = entry[1];
    }
    return JSON.stringify(objData);
};