---
layout: post
title: "坑爹的JPA中的'ddl'"
category: 开发
tags: [JPA]
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
DDL的全称为：Data Definition Language，大概是学数据库课或集成软件开发的时候见过这类的词汇，大概就是数据库中定义数据结构的方式。我查到一个eclipse里的JPA工具里有这么一段：

> Use `eclipselink.ddl-generation` to specify how EclipseLink generates DDL (Data Definition Language) for the database schema (tables and constraints) on deployment.

[EclipseLink](http://www.eclipse.org/eclipselink/)也是一套支持JPA的ORM方案，然而我并没有使用过。。。看名字应该是eclipse的官方组织搞的，但网上说由于文档较少，并不推荐。。

回到上面那段定义，我理解的JPA中ddl的过程如下

1. 读取实体对象类中 Java Annotation 对属性的定义
2. 生成 DDL 的描述文件
3. 根据具体数据库的dialect，生成 schema 的SQL语句
4. 在数据库中生成对应的schema


所以坑是
--------
上述 ddl 的好处在于，当项目刚构建时，或在本地开发新模块时，我们可以先定义实体对象的类，通过 Java Annotation 配置字段和实体对象关系，ddl 可以帮我们自动生成相应的数据库表。这是非常便捷的，因为刚开发时实体对象的属性可能会经常调整，ddl 可以在每次运行项目时自动将这些变化同步到数据库中。

所以回过头再看Play中的那段配置

    # Specify the ddl generation pattern to use. Set to none to disable it 
    # (default to update in DEV mode, and none in PROD mode):
    # jpa.default.ddl=update

所以在开发状态下，ddl可以默认开启，以省去我们手动修改数据库字段的活儿。。而当生产状态下，最好不要开启该 ddl generation 功能！

下面是重点，我的坑在于，我在本地开发状态下，图省事直接让项目连接了服务器上的数据库 <img src="/assets/photos/wulian.jpg" style="width:56px; vertical-align:text-top;">

结果就是我还处于 DEV 状态，然而默认`jpa.default.ddl=update`，当我增加实体对象类中的属性时，就会帮我重新 build 一遍 schema，服务器上我亲手建的数据表里的字段类型和外键索引都乱了。。。最后我把`jpa.default.ddl=none`加上了


教训
-----
1. 本地开发时禁止连接服务器数据库
2. 不要使用 ddl 生成的数据库表，字段类型和外键名很丑，反正最后还得手动调
3. 希望是先手动建表，然后可以使用类似 hibernate 中逆向工程的那种工具将表结构反射到对象class

