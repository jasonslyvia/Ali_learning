/*
 *  淘宝交易数据查阅助手content_scripts文件，用于响应popup中的
 *  数据展示请求，从backgroud_scripst文件（backgroud.js）中获取数据
 *  并在当前页面中展示
 *
 *  @author YangSen<jasonslyvia@gmail.com>
 *  @version 0.2
 */


/*
 *  监听popup发来的请求，进行响应
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.method){
        //淘宝首页点击量展示
        case 'clickData':{
            initData("getClickData", function(clickData){
                labelClickData(clickData.data.spm);
                //针对lazy load产生的a标签，再次尝试添加浏览量标签
                window.addEventListener("scroll",
                                        labelClickData.bind(this, clickData.data.spm),
                                        false);
            });
        }
        break;
        //实时交易数据（曲线图）
        case 'dealTrend':{
            initData("getDealTrend", function(trendData){
                plotLineChart(trendData.date, trendData.data);
            });
        }
        break;
        //小时PV量（矩形图）
        case 'dealHour':{
            initData("getDealHour", function(hourData){
                plotBarChart(hourData.date, hourData.data[0].data);
            });
        }
        break;
        //操作系统分布（饼图）
        case 'OS':{
            initData("getOS", function(OSData){
                plotPieChart(OSData.date, OSData.data);
            });
        }
        break;
        default:
        throw new TypeError("未知popup请求："+request.method);
    }

    //返回popup的响应，关闭popup
    sendResponse();
    return true;
});


/*
 *  初始化数据
 *
 *  @param {function} callback 数据初始化成功后执行的回调函数
 */
function initData(type, callback){
    if (!data) {
        chrome.runtime.sendMessage({method: type}, callback);
    }
    else{
        callback(data);
    }
}

/*
 *  解析date对象
 *
 *  @param {string} dateString 含有日期的字符串
 *  @return {object}
 */
function parseDate(dateString){
    //计算数据日期
    var date = new Date(dateString);
    if (!date) {
        throw new TypeError("无效的日期：" + dateString);
    }
    var hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds(),
        year = date.getFullYear(),
        month = date.getMonth(), //此处不加一，便于后面计算UTC
        day = date.getDate();

    return {
        str: year+'年'+(month+1)+'月'+day+'日',
        year: year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second
    };
}

/*
 *  创建用于展示图表的遮罩层
 *
 *  @param {string} containerId 用于绘制图表的div id
 */
function createMask(containerId){
    $(".mask").remove();

    $("<div class='mask'><div id='" + containerId + "'></div></div>").
    appendTo("body");

    $(".mask").on("click", function(){
        $(this).fadeOut().remove();
    });

    return containerId;
}


/*
 *  对所有的a标签进行遍历，添加点击量数据
 *
 *  @param {object} clickData 包含点击量源数据的对象
 */
function labelClickData(clickData){
    //选出所有的a标签
    var links = document.querySelectorAll('a:not(.click-data-added)');
    for (var l=links.length, i=0; i < l; ++i) {

        var link = links[i];
        //模拟mousedown事件，产生data-spm属性
        if (!!link.onmousedown) {
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
            if (spmData > 1e6) {
                colorClass = "c5";
            }
            else if (spmData > 1e5) {
                colorClass = "c4";
            }
            else if (spmData > 1e4) {
                colorClass = "c3";
            }
            else if (spmData > 1e3) {
                colorClass = "c2";
            }

            link.setAttribute("style", "position: relative;overflow: visible;");
            link.className += " click-data-added";

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
}

/*
 *  绘制条形图
 *
 *  @param {string} date 数据日期
 *  @param {obejct/array} trendData 含有用于绘制图表的源信息对象
 */
function plotLineChart(date, trendData){
    var d = parseDate(date);

    //初始化遮罩层
    var graph = createMask("graph");

    //净化数据
    var refinedTrendData = [];
    trendData.forEach(function(v, i, a){
        refinedTrendData.push(v[1]);
    });

    //获取最高与最低值
    var high = Math.max.apply(null, refinedTrendData);
    var low = Math.min.apply(null, refinedTrendData);

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: graph,
            zoomType: 'x',
            type: 'line'
        },
        title: {
            text: d.str +　'实时交易数据'
        },
        xAxis: {
            type: 'datetime',
            maxZoom: 14 * 60 * 1000,
            title: {
                text: null
            }
        },
        yAxis: {
            title: {
                text: '交易量'
            },
            min: 0,
            plotLines: [{
                value: high,
                width: 2,
                color: '#4A9338',
                label: {
                    text: '最高值：' + high,
                    style: {
                        color: '#898989'
                    }
                }
            },{
                value: low,
                width: 2,
                color: '#821740',
                label: {
                    text: '最低值：' + low,
                    style: {
                        color: '#898989'
                    }
                }
            }]
        },
        tooltip: {
            shared: true
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            line: {
                lineWidth: 1,
                marker: {
                    enabled: false
                },
                shadow: false,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                }
            }
        },
        series: [{
            type: 'line',
            name: '交易量',
            pointInterval: 60 * 1000,
            pointStart: Date.UTC(d.year, d.month, d.day),
            data: refinedTrendData
        }]
    });
}

/*
 *  绘制矩形图
 *
 *  @param {string} date 数据日期
 *  @param {obejct/array} hourData 含有用于绘制图表的源信息对象
 */
function plotBarChart(date, hourData){
    var d = parseDate(date);
    var graph = createMask("graph");

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: graph,
            type: 'column'
        },
        title: {
            text: d.str + '每小时PV数据'
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: null
            }
        },
        yAxis: {
            title: {
                text: 'PV'
            },
            min: 0
        },
        tooltip: {
            shared: true
        },
        legend: {
            enabled: false
        },
        series: [{
            type: 'column',
            name: 'PV',
            pointStart: Date.UTC(2014, 0, 2),
            pointInterval: 1000 * 60 * 60,
            data: hourData
        }]
    });
}

/*
 *  绘制饼图
 *
 *  @param {string} date 数据日期
 *  @param {obejct/array} OSData 含有用于绘制图表的源信息对象
 */
function plotPieChart(date, OSData){
    var d = parseDate(date);
    var graph = createMask("graph");

    //净化数据
    var refinedOSData = [];
    OSData.forEach(function(v,i,a){
        refinedOSData.push([v.name, v.y]);
    });

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: graph,
            type: 'pie'
        },
        title: {
            text: d.str + '操作系统分布'
        },
        plotOptions: {
            pie: {
                slicedOffset: 20,
                allowPointSelect: true,
                dataLabels: {
                    formatter: function () {
                        var label = this.point.name +　':' + Highcharts.numberFormat(this.y, 0);
                        return label;
                    }
                }
            }
        },
        series: [{
            name: '占有量',
            data: refinedOSData
        }]
    });
}