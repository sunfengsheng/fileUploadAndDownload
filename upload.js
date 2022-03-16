
//提交数据
const UPLOAD_URL = "http://localhost:8890/upload";

function clicking() {
    submitUpload(UPLOAD_URL, getElFile("input#test"));
}

  //主体上传功能
async function submitUpload(url, file) {
    const CHUNKSIZE =  16 * 1024 * 1024; // 1M
    const TOKEN = Date.now();
    //切割数组
    const chunkList = sliceFile(file, CHUNKSIZE);
    //创建formdata 并上传
    console.log(file.name);
    let promiseList = createChunkPromiseList(chunkList, file.name, TOKEN);
    //并发控制 上传
    await createLimitPromise(2, promiseList);
    //合并分片
    let mergeFormData = new FormData();
    mergeFormData.append("type", "merge");
    mergeFormData.append("token", TOKEN);
    mergeFormData.append("chunkCount", chunkList.length);
    mergeFormData.append("fileName", file.name);
    //结束后发送合并请

    var request = new XMLHttpRequest();
    request.open("POST", url);
    await request.send(mergeFormData);
    request.onreadystatechange=function()
  {
  console.log("res2 is success")
  }
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
        return formdata;
      })
      .map(formdata => {
        var request = new XMLHttpRequest();
        request.open("POST", UPLOAD_URL,true);
        request.send(formdata);
        request.onreadystatechange=function()
          {
          console.log("res1 is success")
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