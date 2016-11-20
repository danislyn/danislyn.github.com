---
layout: post
title: "网站安全监测 - Node实战"
category: node
tags: [nodejs]
published: false
---
{% include JB/setup %}

（拖了近一年的文章）去年这个时候接了一个心力交瘁的项目，大体目标是：1、为用户的网站提供安全监测的服务，用户在我们的管理端系统中添加一个站点并勾选要检测的项；2、然后由后台爬虫系统完成用户站点链接的入库，并定时针对站内链接执行各种检测任务；3、再由前端系统给用户交付网站监测报表。在中间这一步，最重要的爬虫系统，我第一次学习用 Nodejs 来做。

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
在摘要中已经提到，这个项目的目标分为3步：添加检测任务 => 爬虫执行任务 => 前端报表展现。但在具体实现时，需要对爬虫进行细分，最终会有6步过程。

### 1、添加要监测的站点

<img src="/assets/captures/20161121_create_task_1.png" style="max-width:400px">

在web端添加一个站点任务，输入客户的摘要信息以及要监控的站点列表，然后可以更改检测类别的周期以及具体检测项等配置。

<img src="/assets/captures/20161121_create_task_2.png" style="max-width:400px">

<img src="/assets/captures/20161121_create_task_3.png" style="max-width:400px">

“可用性”检测主要是网站的一些基本信息，通常都在首页的http头中就能找到。而“内容检测”需要对网站中的所有页面进行检测，因此会有一个“检测深度”和“最大页数”的配置，页面深度越深，页面数目会呈指数级增长，这对爬虫服务器是巨大的压力。

此外还有一个“安全检测”的模块，具体检测项有：ActiveX挂马，iframe挂马，js挂马，WebShell后门，暗链，以及后台地址检测。由于我对安全方面了解太少，在这个系统中实现得也很simple，就不多说了。。。


### 2、站点入库

由于上面“内容检测”和“安全检测”都需要对网站首页下的其他页面全部检测，因此我们需要维护一个`site`表和`site_link`表，记录下网站的域名和ip信息，并且存下每个页面链接的信息，包括该页面相对于首页的深度层级，该页面的链接是`同源``同域`还是`外链`，以及页面的发现时间、状态信息等。

另外注意的是，从首页开始取链接，然后再对链接再取它的后继链接，整个过程应采用“广度优先”的策略。而“检测深度”和“最大页数”也是在这个时候进行限制的，如果当前页面深度为N，`N + 1 > 检测深度`，那么该页面就不再往爬取队列中push后继链接了。


### 3、周期性生成检测任务

站点任务配置完，站点链接也入完库，这时候就可以根据上面配置的检测周期来定时产生任务。例如当内容检查的周期到来时，需要取出该站点下所有符合的页面链接，对每个页面的每个检测项都生成1个检测任务。需要注意生成任务时，要按照页面链接的顺序来遍历，而不是先遍历检测项。这样的好处是当具体爬虫执行时，相同url的检测任务在队列中会连续挨着，这样可以给爬虫做爬取的合并，同样的url只需要爬取1遍，就可以给不同的检测任务去执行。


### 4、爬虫执行检测任务

如果说第3步生成任务是“生产者”，那么现在就轮到“消费者”。爬虫系统要支持并发，多机器 + 多线程。在1台机器上，1次从任务队列中取100个出来，如第3步所说检测任务是按相同url连续排列的，那么这100个检测任务可以抽出20个任务组（举个例子），每个任务组都可以只爬取1个页面，然后将内容传递给各检测项去执行。而每个检测项的执行结果都以 log 的形式存储。

如果爬虫的机器不是那种“树莓派”微型机器，那可以先将log以文件形式存到本地，留出带宽给爬虫。或者每个检测项的结果log都发送到1个指定的地方，这就会多占用带宽，也需要专门搞1台日志服务器。


### 5、定时计算日志

爬虫的任务执行过程是很连续又很离散的，连续是因为做完1个就要做下1个，离散是说日志的离散，单独1个页面的1个检测项的1次执行日志并没有太大意义，要整合到整个站点和时间段、检测类别的维度来看才有价值。从前面的步骤可以看到，站点链接的入库以及周期性的生成任务时，会有一定的“顺序”控制，并且只有全部入完库才会进入下一步骤。而爬虫系统是很离散的，它可能分布到多台机器上，只要任务队列中有东西，它就会取出来执行，也不会区分任务是来自哪个站点哪个类别的。

因此，如果log分布在各爬虫机器上，那就需要一个定时的脚本对其进行汇总计算后传回数据中心。而如果有统一的日志服务器，那同样需要将原始日志计算成有效的数据。


### 6、前端报表查询

前端系统直接查数据中心，可以得到站点级和检测类别级的报告。前面“生产者”生成检测任务时，会在数据库中打上一些任务模块的时间信息，前端系统也能够查到一些调度状态信息。


### 架构图

整个系统分为4个部分：前端系统、任务Producer、爬虫系统、日志计算同步进程。架构图如下，可以看到箭头就代表着数据流的方向。

<img src="/assets/captures/20161121_project_architecture.png" style="max-width:500px">

而爬虫调度和执行是典型的“生产者-消费者”模式，这里生产者只有1个，而有N个消费者爬虫进程。

<img src="/assets/captures/20161121_producer_and_runner.png" style="max-width:400px">

所谓的检测任务队列，实际就是数据库中的一张表，多个爬虫进程或多台爬虫机器都共享这张表，只要保证从表的顶部开始读取，读完后就要重置状态位，防止被其他进程重复读取。而当任务执行失败后，会将该检测任务的记录移到table的队尾，并设置1个失败次数的字段。



爬虫实现思路
-----------

### 技术框架

在本文第一节中就列出了一些库，在页面爬取方面，使用[superagent](http://visionmedia.github.io/superagent/)获取页面内容，使用[cheerio](https://github.com/cheeriojs/cheerio)做文档解析。而对于一些不需要解析内容的爬取任务（比如查询某个页面的 header 信息，或是检查某个页面是否 200 状态），使用[request](https://github.com/request/request)来发请求。

对于爬虫系统中最关键的异步流控制，我在实现时做了多种风格的尝试，在数据库读写层面使用promise风格，在检测项内部使用[async](https://github.com/caolan/async)，而在爬虫的实例中使用[eventproxy](https://github.com/JacksonTian/eventproxy)来进行流控制。


### 目录结构

- base/  跟继承和通用相关的
- conf/  各种配置项（检测项的配置、规则的配置）
- constant/  各种常量的定义和配置
- database/  数据库配置和连接池
- models/  数据库表对应的 json schema
- dao/  与model相应的Dao增删改查封装
- util/  通用数据的helper

- factory/  工厂封装类，统一任务的组建过程
- modules/  具体检测项 (爬虫上搭载的具体task实现)
	- basic/  基础信息 可用性检测
	- content/  内容检测大类
	- secure/  安全检测大类
	- common/  站点入库、链接入库，以及抓取页面内容也抽象成1个通用task
- crawler/  爬虫对象与池管理（1个crawler实例只负责1次页面请求）
- scheduler/  监控和调度进程 (每隔一段时间就执行一轮)
	- runner.js  用来执行检测任务 (任务消费者)
	- siteRunner.js  针对“站点链接入库”的runner

- app.js  主程序，用来启动runner
- appSite.js  主程序之一，用来启动SiteRunner
- appPath.js  用来启动低频高请求量的检测任务（详见下面的地址型检测类）


### 检测项管道模式

由上面的结构可以看到，程序运行时的调用过程是：app.js => runner.js => crawler => 具体检测项。


1个`Crawler`对象只负责1次页面请求，



### 检测项分类

```
// 表明这个TaskItem属于哪一大类的TaskFragment (通用的除外)
var modDict = {
	COMMON_CRAWL: 'COMMON_CRAWL',		// 通用爬取方法 如请求页面document, 取链接等
	BASIC_DETECT: 'BASIC_DETECT',		// 可用性检测
	CONTENT_DETECT: 'CONTENT_DETECT',	// 内容检测 合并了篡改检测
	SECURE_DETECT: 'SECURE_DETECT'		// 安全检测
};

// 表明这个TaskItem能否与其他合并, 共用1次请求
var typeDict = {
	EXCLUSIVE: 'EXCLUSIVE',				// 排它性 (独占request的任务)
	INCLUSIVE: 'INCLUSIVE'				// 可合并性 (只需传递context)
};

// 表明这个TaskItem应该在哪个表中, 应该交给哪个Runner处理
var runnerTypeDict = {
	COMMON: 'COMMON_TASK',				// 普通任务 -> crawl_task ->
	SITE: 'SITE_TASK',					// 站点入库类 -> site_crawl_task -> SiteRunner
	PATH: 'PATH_TASK'					// 路径检测类 -> path_crawl_task ->
};
```




总结展望
--------


