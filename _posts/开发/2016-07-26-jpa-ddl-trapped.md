---
layout: post
title: "坑爹的JPA中的'ddl'"
category: 开发
tags: [JPA]
published: false
---
{% include JB/setup %}

以前做学校里的项目时强推了一把 Play Framework，鼓吹它有多么多么轻量，它用JPA做ORM是多么方便，可参考以前的文章 [JPA泛型DAO](/blog/2015/02/01/generic-dao-for-jpa) 和 [mooctest项目总结](/blog/2016/01/24/project-guideline-of-mooctest)。直到今天踩到了个坑。。。记录下JPA中坑爹的`ddl`参数

<!-- break -->

JPA
-----
JPA全称为：Java Persistence API。JPA通过Java中的 Annotation 或 XML 来描述“对象－关系表”的映射关系，并将运行期的实体对象持久化到数据库中。这是查自百度的解释，可简单理解为就是Java小组为 ORM(Object Relational Mapping) 定了一套接口规范，我们常见的 Hibernate 和 Spring 中的ORM都可理解为是 JPA 的一种具体实现。（*各框架对接口规范的实现程度和匹配度可能并不完全。。。*）


Play中的JPA
------------
在[Play Framework 1.2.7](https://www.playframework.com/documentation/1.2.x/home)中，其JPA底层采用的是 Hibernate 3.6 的实现。在Play的`application.conf`文件中可以看到有如下一段配置说明：

    # Specify the ddl generation pattern to use. Set to none to disable it 
    # (default to update in DEV mode, and none in PROD mode):
    # jpa.default.ddl=update

在调试模式下，`jpa.default.ddl`的默认值就是`update`。。。那到底什么是`ddl`呢，坑又是啥？


ddl
----


