---
layout: post
title: "前端模块化开发demo之攻击地图"
category: javascript
tags: [javascript, AMD]
published: false
---
{% include JB/setup %}

很早以前写过一篇[用RequireJS包装AjaxChart](/blog/2015/02/07/wrap-ajaxchart-with-requirejs/)，当时用Highcharts做图表，在其上封装了一层ajax，最后只是简单套用了一下requireJS。由于当时自己才接触模块化，理解层面还太浅，后来经过其他项目的磨练以及实习获得的见识，想重新结合一个示例来写点前端模块化的开发方式。

<!-- break -->

项目背景
--------
最近在做一个安全运维监控的项目，其中有一条是根据设备获取到的攻击数据，在地图上做可视化。对比了[Highcharts](http://www.hcharts.cn/)和[ECharts](http://echarts.baidu.com)

- ECharts对国内地图的支持更多
- ECharts在模块化和扩展方面做的比Highcharts更好

所以最后我选择了基于ECharts去封装。类似的网络攻击的监控地图可看国外的[Norse Attack Map](http://map.norsecorp.com)，也算是同类的参照。


需求整理
--------
数据要求

- 提供的数据只有IP到IP的攻击，包括攻击时间、攻击类型等，需要自行根据IP定位到相应的经纬度。

展现要求

- 地图提供世界、中国、省份，这三种维度（只针对中国）
- 要在地图上表现出攻击的来源与目标之间的动画
- 需要强调出攻击受灾地区，可一眼看出哪里是重灾区
- 可以循环表现攻击，也可实时刷新攻击数据


目录结构
--------

	- index.html 主页面
	- assets
		- css
			- normalize.css 浏览器初始化样式
			- common.css 从bootstrap里扒了一些基础样式
		- img/ 
	- js
		- app
			- mainMap.js index页面的主执行js
		- lib
			- echarts/ 用了源码包
			- zrender/ 同样源码包，具体看echarts官方说明
			- geo 一些地理数据的定义
				- china/
				- world/
			- mods
				- attackMap/ 对echarts map的封装
				- util.js 等等其他帮助或插件模块的封装
				- xxxx.js
		- config.js

### requireJS的config配置

	requirejs.config({
	    baseUrl: 'js/lib',
	    paths: {
	    	jquery: 'http://cdn.staticfile.org/jquery/1.7.2/jquery.min',
	        underscore: 'http://cdn.staticfile.org/underscore.js/1.7.0/underscore-min'
	    },
	    packages: [
	        {
	            name: 'echarts',
	            location: 'echarts/src',
	            main: 'echarts'
	        },
	        {
	            name: 'zrender',
	            location: 'zrender/src',
	            main: 'zrender'
	        }
	    ]
	});


map封装过程
-----------




还有什么欠缺的
-------------

模板、样式和js模块捆绑，即只需reuqire一下模块，模块相应的css会一起载入




### demo

- [在线demo](http://fuxiaode.cn/demo/AttackMap/index.html)

- [demo源码](https://github.com/danislyn/danislyn.github.com/blob/master/demo/AttackMap/)

### 感想

- 在繁忙的项目中抽出时间做些整理和总结，是件重要但不紧急的事情。

- 和以前写的文章一对比，明显感觉到自己这半年多的成长。
