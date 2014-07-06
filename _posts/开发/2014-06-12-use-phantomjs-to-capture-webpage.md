---
layout: post
title: "使用phantomjs对网页截图"
description: "phantomjs是一个基于webkit的无界面浏览器，你可以通过javascript的语法去控制它。它与传统的爬虫不同，爬虫是直接对Http Response进行处理，只能获取所有的原始数据（包括DOM document和script），至于script执行后会对document产生怎样的改变，它不知道，只能自己写业务逻辑去处理。而phantomjs就是一个浏览器，它包含完整的渲染引擎和js执行器，它可以站在浏览器层面（而不是Http Response）去看待问题。因此phantomjs被主要用于网页截图，网络检测（Monitoring），以及界面测试（Testing）等。"
category: 开发
tags: [截图, javascript]
---
{% include JB/setup %}


问题来源
---------
我们在做一个电商数据分析的项目，web前端的数据展示使用的是[Highcharts](http://www.highcharts.com/)库。目前我们的项目正在做移动版，以微信消息或微博的形式给用户推送summary信息，然后再以手机浏览器的形式展示详细信息。这里就存在个问题，首先，Highcharts是依赖jQuery的，这两个库对于移动端来说有点大了，移动web端目前流行使用更轻量级的[zepto](http://zeptojs.com/)来代替jQuery。其次，Highcharts的图表类型在手机浏览器上并不能很好的支持，会出现有些图表无法正确显示，比如bar-stacked图。



退而求其次
-----------
移动版就是为了用户能够随时随地看咨询，操作方便和传输速度是第一位的。而且对于图表这类东西，由于触屏的限制（它没有hover的概念），本身就不好像PC浏览器那样做图表上的交互。因此移动端的图表可以暂不考虑交互，优先给用户图表的静态图片即可。



最低成本方案
-------------
由于PC端web已经采用Highcharts绘制了数据图表，因此自然会想到两种办法。

1. 使用Highcharts自带的exporting module，将chart转成图片形式。

2. 直接在浏览器里对相应的图表区域截图。

不管用哪种方法，我们首先要把系统中所有的图表的地方汇聚起来，做一个REST API，将功能的action、参数以及图表类型传入url中，统一生成Highchart。

如果使用第1种办法，那得引入Highcharts里的exporting.js，然后找到export函数的入口，想办法以执行脚本的方式导出图片。但这里有两个问题，第一，如果通过写程序的方式（python中是urlopen）去访问该REST API，如何执行js脚本呢。第二，就算能执行js脚本，Highcharts自带的exporting服务器肯定会把频繁的请求拒了，因此还得自己写exporting的后台，虽然官方给出了exporting server的示例代码。

出于这些考虑，我决定朝第2中方法努力。



phantomjs
----------
[phantomjs](http://phantomjs.org/)是一个基于webkit的无界面浏览器，你可以通过javascript的语法去控制它。它与传统的爬虫不同，爬虫是直接对Http Response进行处理，只能获取所有的原始数据（包括DOM document和script），至于script执行后会对document产生怎样的改变，它不知道，只能自己写业务逻辑去处理。而phantomjs就是一个浏览器，它包含完整的渲染引擎和js执行器，它可以站在浏览器层面（而不是Http Response）去看待问题。因此phantomjs被主要用于网页截图，网络检测（Monitoring），以及界面测试（Testing）等。



casperjs
---------
[casperjs](http://casperjs.org/)是对phantomjs的一个封装，提供了浏览器的多步访问，填写表单，点击事件，以及截图的自定义等。最重要的就是它的多步访问，提供了更好的异步操作，可避免callback的多层嵌套。

###未完待续
