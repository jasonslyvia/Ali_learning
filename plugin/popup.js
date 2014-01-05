/*
 *  响应点击插件popup菜单中按钮事件
 */
document.addEventListener("DOMContentLoaded", function(){
    var ul = document.getElementsByTagName("ul")[0];
    ul.addEventListener("click", function(e){
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {method: e.target.id}, function(){
                setTimeout(function(){
                    window.close();
                }, 300);
            });
        });
    });
});
