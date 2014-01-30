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
        //来源去向图（d3手绘）
        case 'fromTo': {
            initData("getFromTo", function(fromToData){
                plotFromToGraph(fromToData);
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
var dataArr = [];
function initData(type, callback){
    if (!dataArr[type]) {
        chrome.runtime.sendMessage({method: type}, function(data){
            dataArr[type] = data;
            callback(data);
        });
    }
    else{
        callback(dataArr[type]);
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

function plotFromToGraph(fromToData){
    var graph = createMask("graph");

    //用于编辑每一侧矩形的累计高度，以便设置纵向偏移
    var totalHeight = 0;
    //矩形之间的纵向间隔
    var marginTop = 5;

    //svg画布的长宽
    var viewHeight = 500;
    var viewWidth = 800;

    //矩形的最小、最大高度
    var minHeight = 20;
    var maxHeight = 100;
    //矩形的宽度
    var rectWidth = 180;
    //左矩形中label的横坐标
    var leftRectLabelX = 5;
    //左矩形中数据label的横坐标;
    var leftRectValueX = 170;
    //右矩形中label的横坐标
    var rightRectLabelX = 100;
    //右矩形中数据label的横坐标;
    var rightRectValueX = 5;

    //中间矩形的长宽
    var centerRectHeight = 250;
    var centerRectWidth = 150;

    //矩形与中间节点之间的距离
    var gap = (viewWidth - rectWidth * 2 - centerRectWidth) / 2;

    //中间矩形四边距
    var centerRectTop = 125;
    var centerRectLeft = rectWidth + gap;
    var centerRectRight = centerRectLeft + centerRectWidth;

    //中心连线宽度
    var lineWidth = 10;
    var halfLineWidth = lineWidth / 2;
    //中心连线beizer曲线系数
    var bezierFactor = 0.4;

    //将矩形所占百分比map到[0,viewHeight]区间以计算高度
    //TODO: 两边矩形总高度不同
    var scaleFunc = d3.scale.linear()
                      .range([0, viewHeight])
                      .domain([0, 1]);

    draw(fromToData);
    /*
     *  d3核心绘图函数
     *
     *  @param {mixed} data 源数据
     */
    function draw(data){
        'use strict';

        var svg = d3.select("#graph")
          .append("svg")
          .attr("width", viewWidth)
          .attr("height", viewHeight);

        //添加filter
        addShadowFilter(svg);

        //绘制来源
        svg.selectAll("g")
          .data(cleanData(data.data.previous), function(d){
            return d.name;
          })
          .enter()
          .append("g")
          .each(function(d, i){
            return drawG.call(this, d, i, "left");
          });

        totalHeight = 0;
        //绘制去向
        svg.selectAll("g")
          .data(cleanData(data.data.next), function(d){
            return d.name + Math.random();
          })
          .enter()
          .append("g")
          .each(function(d, i){
            return drawG.call(this, d, i, "right");
          });

        //绘制中心节点
        var centerG = svg.append("g")
                            .attr("class", "svg-center-g")
                            .attr("transform", "translate("+centerRectLeft+", "+centerRectTop+")");
        centerG.append("rect")
            .attr("class", "svg-center-rect")
            .attr("height", centerRectHeight)
            .attr("width", centerRectWidth);
        centerG.append("text")
            .attr("class", "svg-center-label")
            .text(data.data.core.name)
            .attr("x", 40)
            .attr("y", 30);
        centerG.append("rect")
            .attr("class", "svg-button-rect")
            .attr("width", 80)
            .attr("height", 20)
            .attr("x", 35)
            .attr("y", 50)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("filter", "url(#shadowFilter)");
        centerG.append("text")
                .attr("class", "svg-button-label")
                .text("uv:100%")
                .attr("x", 50)
                .attr("y", 65);
        centerG.append("a")
                    .attr("xlink:href", "http://taobao.com")
                    .attr("target", "_blank")
                    .attr("class", "svg-link")
               .append("text")
                    .html("更多数据&gt;")
                    .attr("x", 90)
                    .attr("y", 90);
    }

    /*
     *  绘制一个简单的内容框（包含数据名及值）
     *
     *  @param {d} object 数据的详细信息
     *  @param {i} int 当前数据的index
     *  @param {type} string 若绘制左侧内容，则type为"left";若右侧则为"right"
     *                       根据此参数调整内容框内数据名及值的位置
     *  @return {返回类型}
     */
    function drawG(d, i, type){
        var g = d3.select(this);
        var gHeight = 0;

        g.attr("class", "svg-g")
        .attr("transform", function(){
            var x = type == "left" ? 0 : centerRectRight + gap;
            return "translate("+ x +"," + totalHeight +")"
        })
        //添加背景块
        .append("rect")
        .attr("class", "svg-rect")
        .attr("height", function(d){
            var height = scaleFunc(d._percentage);
            //限定最小、最大值
            height = Math.max(minHeight, height);
            height = Math.min(maxHeight, height);

            gHeight = height;
            return height;
        })
        .attr("width", rectWidth);

        //绘制来源一侧
        //TODO: don't hack
        if (type == "left") {
            var y = gHeight / 2 + halfLineWidth;
            drawText(g, d.name, "svg-text-label", leftRectLabelX, y, "start");
            drawText(g, d.percentage+'%', "svg-text-value", leftRectValueX, y, "end");
            //与中心点连线
            var initX = rectWidth;
            var initY = totalHeight + marginTop + gHeight / 2 - halfLineWidth;
            var finalY = i * lineWidth + 200;
            var finalX = centerRectLeft;

            var deltaX = finalX - initX;
            //使用cubic bezier curve
            var middleX = finalX - deltaX * bezierFactor;
            var middleY1 = initY;
            var middleY2 = finalY;

            var path = "M"+ initX +"," + initY;
            path += " C" + middleX + "," + middleY1;
            path += " " + middleX + "," + middleY2;
            path += " " + finalX + "," + finalY;
            d3.select("svg")
              .append("path")
              .attr("class", "svg-path")
              .attr("d", path);
        }
        //绘制去向一侧
        else if (type == "right") {
            var y = gHeight / 2 + halfLineWidth;
            drawText(g, d.percentage+'%', "svg-text-value", rightRectValueX, y, "start");
            drawText(g, d.name, "svg-text-label", rightRectLabelX, y, "start");

            //与中心点连线
            var initX = centerRectRight + gap;
            var initY = totalHeight + marginTop + gHeight / 2 - halfLineWidth;
            var finalY = i * lineWidth + 200;
            var finalX = centerRectRight;

            var deltaX = finalX - initX;
            //使用cubic bezier curve
            var middleX = finalX - deltaX * bezierFactor;
            var middleY1 = initY;
            var middleY2 = finalY;

            var path = "M" + initX + "," + initY;
            path += " C" + middleX + "," + middleY1;
            path += " " + middleX + "," + middleY2;
            path += " " + finalX + "," + finalY;
            d3.select("svg")
              .append("path")
              .attr("class", "svg-path")
              .attr("d", path);
        }

        //更新总高度，方便计算下一个g的纵向偏移
        totalHeight = totalHeight + marginTop + gHeight;
    }

    /*
     *  绘制svg text元素
     *
     *  @param {object} g 父元素
     *  @param {string} text 文本内容
     *  @param {string} className 元素类名
     *  @param {int} x 横向偏移
     *  @param {int} y 纵向偏移
     *  @param {string} anchorStyle 文本对齐方式
     *  @return {返回类型}
     */
    function drawText(g, text, className, x, y, anchorStyle){
        g.append("text")
        .attr("class", className)
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", anchorStyle)
        .text(text);
    }

    //为svg增加filter
    function addShadowFilter(svg){
        var filter = svg.append("defs")
                .append("filter")
               .attr("id", "shadowFilter")
               .attr("height", "130%");
        filter.append("feGaussianBlur")
                   .attr("in", "SourceAlpha")
                   .attr("stdDeviation", 1.5)
                   .attr("result", "shadow");
        filter.append("feOffset")
                .attr("in", "shadow")
                .attr("dy", .5)
                .attr("result", "offsetShadow");
        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
                   .attr("in", "offsetShadow");
        feMerge.append("feMergeNode")
                   .attr("in", "SourceGraphic");
    }

    /*
     *  数据清理，获得每一项数据占总数据的百分比
     *
     *  @param {object} data 原始数据
     *  @return {object}
     */
    function cleanData(data){
        if (!Array.isArray(data)) {
            throw TypeError(data + " is not an array");
        }
        var totalPercentage = 0;
        data.forEach(function(el, index){
            totalPercentage += el.percentage;
        });

        data.forEach(function(el, index){
            el._percentage = el.percentage / totalPercentage;
        });
        return data;
    }
}