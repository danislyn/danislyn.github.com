---
layout: post
title: "网站安全监测 - Node实战"
category: node
tags: [nodejs]
published: false
---
{% include JB/setup %}

一个做的心力交瘁的项目，大体目标是：为用户的网站提供安全监测的服务，用户在我们的管理端系统中添加一个站点并勾选要检测的项；然后由后台爬虫系统完成用户站点链接的入库，并定时针对站内链接执行各种检测任务；再由前端系统给用户交付网站监测报表。在中间这一步，最重要的爬虫系统，我第一次尝试用 Nodejs 来做项目。

<!-- break -->

Node起步
----------
安装

- nvm
	
		curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.2/install.sh | bash

- node 0.12.x

		nvm install 0.12

- cnpm 镜像

		npm install --registry=http://r.cnpmjs.org -g cnpm

- debug 工具

		cnpm install -g node-inspector
		node-debug yourApp.js

教程

- [Node.js 包教不包会](https://github.com/alsotang/node-lessons)
- [中文API文档](https://davidcai1993.gitbooks.io/nodejs-api-doc-in-chinese/content/)

一些库

- 用于爬虫
	- [superagent](http://visionmedia.github.io/superagent/) 处理请求的模块
	- [request](https://github.com/request/request) 另一个处理请求的模块，比起superagent，语法配置项更多一些。如果说superagent是`$.post()`，那request就是`$.ajax()`
	- [cheerio](https://github.com/cheeriojs/cheerio) 用于DOM解析，提供与jquery选择器类似的接口

- 异步流程控制
	- [Q in Github](https://github.com/kriskowal/q) Promise化的一种实现，promise不是万能，改造复杂的动态决定的执行链是件比较吃力的事情
	- [async](https://github.com/caolan/async) 点赞数很高的库，有人说有毒，我觉着很好用
	- [eventproxy](https://github.com/JacksonTian/eventproxy) @朴灵的基于事件的流程控制，我觉着和promise或async搭配着使用很好用


主程序设计
----------



检测项串联
----------



异步控制流
---------
主程序 async
检测项载体 eventproxy
检测项内部 async
数据库读写 promise
