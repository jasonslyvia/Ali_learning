#踏上数据可视化之路 —— 阿里BI前端培训总结

得知自己将进入BI部门做数据可视化相关的工作后，我的心情不再像刚拿到阿里 offer 时那么激动。虽然声称对数据可视化感兴趣，可页面上这些漂亮的、可交互的图表是怎么实现的我却完全没有头绪。好在阿里的鱼相（[@俞雨](https://github.com/yuyu1911)）师兄及时从天而降，给我规划了一条清晰又可行的入门之路。

这一系列四个阶段的培训下来，我已经对将要进行的工作有了大致的了解。从基础工具（Git、sourceTree）到平台（Chrome），从技术（SVG）到类库（Highcharts、D3），我都上手操练了一番。虽然 Git 和 Chrome 是老朋友，SVG、Highcharts 和 D3 却是的的确确的新伙伴，学习过程中收获颇多，谨以此文做些许记录。

##Git 原来还可以这么用

> 用 SVN 的程序员已经提交代码回家了，用 Git 的人还在 Google 什么是变基（~~become a gay~~ rebase）。

之前我使用 Git，除了基本的 git add、git status 和 git commit，了不起自己 init 一个项目在添加个 remote repo。但是因为考虑到以后的正式工作可能会频繁的使用 Git，我又认真的研究了 Git 强大的 branch 功能（虽然这些在本项目中都没有任何体现）。此外，鱼相师兄传授的 sourceTree 应用强大之极，各种操作都能可视化进行，可谓 Git 的黄金搭档啊！

产出：在 Github 上初始化本次培训的项目

Commits：[0581186e97](https://github.com/jasonslyvia/Ali_learning/commit/0581186e975588233ba5c7ee2ace3ff89f441915)  [0a22eedccf](https://github.com/jasonslyvia/Ali_learning/commit/0a22eedccfdb5077c215db96e371381d98baf34a)  [5f9044b2d6](https://github.com/jasonslyvia/Ali_learning/commit/5f9044b2d60f36d96a8fdfcf0c9b1b2b1584cfa2)  [f966afa239](https://github.com/jasonslyvia/Ali_learning/commit/f966afa23941e7179723df30f99e441aba709f90)

##正确的开发 Chrome 插件

Chrome 之强大我已经领教过，培训开始前我自己也完成了一款 Chrome 插件的开发（[In-page Highlighter](https://github.com/jasonslyvia/In-page-Highlighter)）。这次学习数据可视化的知识，成果的展现也是基于 Chrome 插件实现，这对我来说并不陌生。

但是第二次进行开发，也有了很多的收获，比如在 `manifest.json` 文件中可以进行很多实用的配置，比如设置脚本执行的时间。这样就不需要手动在脚本中监听 `DOMContentLoaded` 事件，减少代码逻辑的同时，也避免了监听回调被意外取消的问题。

产出：一款显示淘宝首页数据点击量的 Chrome 插件

Commits：[c33d935256](https://github.com/jasonslyvia/Ali_learning/commit/c33d935256a7a5216b464f1eebfc32ff4ba84420) [cc246dd2be](https://github.com/jasonslyvia/Ali_learning/commit/cc246dd2be0b78df2ea03b46e604d49a5c6f7dfa) [1497e9f650](https://github.com/jasonslyvia/Ali_learning/commit/1497e9f650e3370c2b0bf612ad8a7da7c49b3e34)

##初识 Highcharts.js

在经历了基础知识的重温后，我终于接触到了实实在在的『数据可视化』—— 图表。第一次使用 Highcharts.js，我看到其官网上的配置参数列表就已经两眼昏花（当然后来再看了 D3 后已经十分淡定）。复杂的配置，类型繁多的图表类型，多种数据格式支持……每一个知识点都需要好一阵子 Google（在此鸣谢 Google 和 stackoverflow）。

Highcharts 的强大之处在于完全封装了图表实现的细节，你只要把数据和需要的格式告诉 Highcharts，它就会尽职尽责的绘出想要的图表。这有点类似 jQuery 之于原生 JavaScript。

在熟悉 Highcharts 的同时，我也完成了对插件的重构，对功能进行了封装，同时引入了之前没有涉猎的 popup 模块。

产出：基于 Highcharts 的折线图、柱状图和饼图

Commits：[86a61cc4fd](https://github.com/jasonslyvia/Ali_learning/commit/86a61cc4fdd7b50102407458b8fd3332fbe6762c)

##真正的利器 D3.js

还没有从 Highcharts 复杂的参数列表中反应过来，我又一头栽进了 D3 的无底洞中。在学习 D3 之前，我老老实实的去 W3School 温习了一遍 SVG 的相关知识。这个启蒙我前端知识的网站，还是那么的质朴而简单……跑题了……

D3 给我的第一印象并不是『复杂』、『强大』，而是非常直观的『绚丽』。D3 首页（[http://d3js.org](http://d3js.org)）的 Examples 让我不敢相信这些可以直接通过 SVG 技术实现。我用 Chrome 一个个的进行审查，不停的感叹每一个 path、每一个 rect、每一个 g 都组合的那么巧妙。

与上面提到的 Highcharts 不同，D3 不仅能够绘制这些图表，而且可以精确的控制一个模块（或者说每一个元素？）。无论是样式、数据还是交互，D3 统统可以搞定。其类似于 jQuery 的链式操作不会让人陌生，虽然关于 `.enter()`、`.selectAll()` 等操作还是让我纠结了很久。

产出：基于 D3 的流量来源去向图

Commits：[81b2663281](https://github.com/jasonslyvia/Ali_learning/commit/81b2663281e98ce3e7a3dadf2bcb3702f9f8b6ab)

##小结

以上便是我这两个月以来的学习总结与体会，虽然自己感觉收获颇丰，但我依然诚惶诚恐的相信，自己需要学习的还是太多太多。我一直是一个实用主义者，也坚信最好的学习就是不断的实践。因此我期待着加入阿里的那一刻，让我敲打出的每一个字符，在亿万人的浏览器中发出光和热。
