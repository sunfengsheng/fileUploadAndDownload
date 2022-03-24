var ip = "http://39.96.14.155"
// var ip = "http://127.0.0.1"
var port = ":8888"
//提交数据
const DOWNLOAD_URL = ip+port+"/download";
function downloadclick() {
    downloadFile()
}

function getToken(selector) {
    return document.querySelector(selector).value;
}

function downloadFile(){
    var token = getToken("input#download")
    console.log(token)
    let formdata = new FormData();
    formdata.append("token", token);
    var request = new XMLHttpRequest();
    request.open("GET", DOWNLOAD_URL+'?token='+token,true);
    request.send(formdata);
    request.onreadystatechange=function()
      {
        if(request.readyState === XMLHttpRequest.DONE && request.status === 200) {
        console.log(request.responseURL)
        }
      }
      request.onload = function (e) {
        var contentType = request.getResponseHeader("content-type");
        const blob = new Blob([request.response], { type: contentType }); 
        let link = document.createElement("a");
        var fileName = decodeURI(request.getResponseHeader('filename'))
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        link.remove();
        window.URL.revokeObjectURL(link.href);
    }
}