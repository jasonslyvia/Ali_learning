/*
 *  将淘宝首页上的所有链接都标上相应的链接点击数据
 *
 *  @author YangSen<jasonslyvia@gmail.com>
 *  @version 0.0.1
 */

document.addEventListener("DOMContentLoaded", labelClickData, false);
window.addEventListener("load", labelClickData, false);
//针对lazy load产生的a标签，再次尝试添加浏览量标签
window.addEventListener("scroll", labelClickData, false);


var clickData = null;
/*
 *  初始化点击量数据
 *
 *  @param {function} callback 点击量初始化成功后执行的回调函数
 */
function initData(callback){
    if (!clickData) {
        chrome.runtime.sendMessage({method: "getClickData"}, callback);
    }
    else{
        callback(clickData);
    }
}

/*
 *  对所有的a标签进行遍历，添加点击量数据
 */
function labelClickData(){
    initData(function(clickData){
        //选出所有的a标签
        //var links = document.getElementsByTagName("a");
        var links = document.querySelectorAll('a:not(.click-data-added)');
        for (var l=links.length, i=0; i < l; ++i) {

            var link = links[i];

            //该链接已经添加了点击量标签
            // if (link.className.match(/click-data-added/i)){
            //     continue;
            // }

            //模拟mousedown事件，产生data-spm属性
            if (link.onmousedown) {
                link.onmousedown();
            }
            else{
                var evt = new MouseEvent("mousedown", {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                link.dispatchEvent(evt);
            }

            //获取spm值
            var spm = link.getAttribute("data-spm-anchor-id");
            if (!spm) {
                continue;
            }
            //从data中获取点击数据后添加到DOM中
            else{
                var spmData = parseInt(clickData[spm], 10);
                if (!spmData) {
                    spmData = "";
                }

                //不同数量级的标签拥有不同的颜色
                var colorClass = "c1";
                if (spmData > 1000000) {
                    colorClass = "c5";
                }
                else if (spmData > 100000) {
                    colorClass = "c4";
                }
                else if (spmData > 10000) {
                    colorClass = "c3";
                }
                else if (spmData > 1000) {
                    colorClass = "c2";
                }

                link.setAttribute("style", "position: relative;overflow: visible;");
                link.className = link.className + " click-data-added";

                //生成点击数标签
                var span = document.createElement("span");
                var text = document.createTextNode(spmData);
                span.appendChild(text);
                span.className = "chrome-click-data " + colorClass;
                span.setAttribute("style", "position:absolute;"+
                                            "left:"+ 0 + "px;"+
                                            "top:" + 0 + "px;");

                link.appendChild(span);
            }
        }//for
    });
}


/*
 *  获取父容器的spm值
 *
 *  @param {Node} node 子节点的引用，一般为a标签
 *  @return {string}
 */
function getParentSpm(node){
    while(node = node.parentNode){
        if (node.tagName.toLowerCase() === "div" &&
            node.getAttribute("data-spm") !== null) {
            return node.getAttribute("data-spm");
        }
    }
    return null;
}