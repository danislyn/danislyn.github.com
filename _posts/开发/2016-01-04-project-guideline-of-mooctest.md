---
layout: post
title: "mooctest项目总结"
category: 开发
tags: [泛型编程, Testing]
published: false
---
{% include JB/setup %}

[慕测平台](http://mooctest.net)（简称mooctest），这个项目致力于编程类考试和练习的服务平台，教师可以轻松监管考试流程，学生可以自由练习编程。系统负责编程练习的自动化评估及可视化展现，配合当下红火的MOOC慕课课程，慕测平台将是学生自学编程的好帮手。目前已支持的编程类型有：Java覆盖测试，Java测试驱动编程，Python统计编程，C++编程，Jmeter性能测试，以及Android应用测试。之所以叫“mooctest”是因为“测试”是我们的主打产品，其中Java覆盖测试、Java Debug分析，以及Android应用测试是我们的核心服务。我们帮助高校的教“软件测试”的老师便捷地组织在线考试，帮助高校的学生接触到工业界真实的app案例，以提高学生的testing能力。

<!-- break -->

项目概况
--------
- [mooctest](http://mooctest.net)于2014.8月下旬开始启动项目，最初开发者只有2位
- 2014.11月，完成考试管理平台的基础建设，以及Java覆盖测试的客户端，开始第一轮内测
- 2014.12月，参加项目原型展示，收集第二轮内测
- 2015.1月，添加对Java覆盖测试的考题分析功能
- 2015.3月，正式上线
- 2015.5月，项目扩张，不断添加新科目，Java测试驱动编程，Python编程，Jmeter性能测试，以及Android应用测试也有了雏形
- 2015.7月，Android应用测试独立成[Kikbug系统](http://kikbug.net)，完成和[mooctest](http://mooctest.net)系统的对接
- 2015.9月，Android应用测试与“阿里”达成合作，获得企业内测的真实app
- 2015.10月，正式在南京大学、东南大学、南京邮电大学、南通大学、大连理工等重点高校试点，作为其“软件测试”课程的白盒测试（以Java覆盖测试为例）和黑盒测试（以Android应用测试为例）的练习和考试平台
- 2015.12月，联合“阿里云测”以及[TesterHome](https://testerhome.com)举办[阿里云测找 bug 大赛](https://testerhome.com/topics/3873)，圆满落幕！
- 截至目前，[mooctest](http://mooctest.net)平台上已有近1万名学生和400名老师，来自全国各地500多个高校！


项目结构
--------
我作为“码农”，还是来说说我更擅长的事，总结下这个项目的技术选型以及组织结构，以便为今后的项目作参考。

整体上我们就采用了基于Java的[Play Framework 1.2.7](https://www.playframework.com/documentation/1.2.x/home)的版本，之后出的`2.0.x`以上的版本是基于SCALA的，和`1.2.x`完全不是一个东西。而Play框架对“从Java学起的学生”来说非常友好，比起 Struts 和 Spring 省去了很多繁琐的xml配置和Annotation配置。综合学习成本和项目定位，Play框架是性价比很高的选择。


### 目录结构

- lib/
- conf/
	- routes
	- messages.en
	- messages.zh_CN
- app/
	- common
	- controllers 以角色名开头，命名区分
		- AdmAccountController.java
		- TeaExamController.java
		- StuExamController.java
	- managers
		- admin/
		- student/
		- teacher/
		- application/
		- interfaces/
	- models
	- dao 其中每个具体model的DAO类都继承GenericDao
	- data.structure 跟前台交互约定的非数据库model的数据类型
	- utils
		- application/
			- DataUtil.java
			- ParamUtil.java
			- ResponseUtil.java
			- SessionUtil.java
			- VcodeUtil.java
		- data/
			- EncryptionUtil.java
			- ExcelUtil.java
		- file/
		- mail/
	- jobs 定时任务相关
	- extensions 对页面模板语法的扩展
	- views

- app/views/
	- Base
	- Application
	- class、exam、exercise等具体功能包
	- tags/
		- examView.html

- public/
	- css/
		- common
		- bootstrap
		- jquery-ui
		- tablesorter
		- others
		- class、exam等具体功能包
	- file
	- svg
	- images
		- bootstrap
		- jquery-ui
		- others
	- js
		- common
		- bootstrap
		- jquery-ui
		- tablesorter
		- others
		- class、exam等具体功能包


数据库与ORM
-----------


DAO事务与泛型编程
----------------


后端MVC框架
-----------

### route配置规范


前端页面继承与复用
----------------


前端UI组件的沉淀
--------------


多语言的支持
-----------

### 系统语言判断

### 语言字典

### 后端返回文案

### 前端的文案


邮件队列与定时任务
----------------

### EDM服务购买

### 域名配置

### SMTP接口

### 队列设计

### 立即任务与定时任务


后记
-----
