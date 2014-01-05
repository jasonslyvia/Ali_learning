//使用最新的chrome.runtime API
//为兼容低版本chrome自定义chrome.runtime
if (!chrome.runtime) {
    // Chrome 20-21
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    // Chrome 22-25
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}

//简单常数封装
var DATA = {
    getClickData: "data/click.json",
    getDealTrend: "data/deal-trend.json",
    getDealHour: "data/deal-hour.json",
    getOS: "data/os.json"
};


/*
 *  监听chrome插件发来的请求，进行响应
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (DATA.hasOwnProperty(request.method)){
        ajax(chrome.extension.getURL(DATA[request.method]),
            'get',
            null,
            sendResponse);
    }
    //return true才会将response发回给content script!!!
    return true;
});

/*
 *  封装ajax操作
 *
 *  @param {string} url ajax请求发送地址
 *  @param {string} method 请求方式，get、post等
 *  @param {mixed} data 附加饿数据
 *  @param {function} callback ajax操作完成后的回调函数
 */
function ajax(url, method, data, callback){

    method = method || "get";
    data = data || null;

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (typeof callback === "function") {
                var data = JSON.parse(xhr.responseText);
                callback(data);
            }
            else{
                throw new TypeError("ajax回调函数参数并不是一个函数");
            }
        }
    };
    xhr.open(method, url);
    xhr.send();
}