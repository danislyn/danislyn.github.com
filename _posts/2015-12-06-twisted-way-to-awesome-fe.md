---
layout: post
title: "前端要给力"
category: 
tags: []
published: false
---
{% include JB/setup %}

一直想总结下自己摸打滚爬的前端经历，3年，从一个极讨厌前端的人，变成一个吃前端饭碗的人。没有人带过我，跌跌撞撞的缓慢前进，但我很喜欢分享，喜欢帮助别人进步，"共同成长"会是我以后一直乐意做的事情。

<!-- break -->

综述
-----

### 娃娃学步

- [w3cschool](http://www.w3school.com.cn)上的 html / css / javascript / 以及jquery教程，万事开头的第一步

> Say hello to the world!

### 小跑上路

- jquery 轻松玩耍DOM和event
- jquery-ui 增强的UI组件
- [Bootstrap](http://www.bootcss.com) 从此傻瓜式排版就能搞定
- [Bootstrap 主题模板](http://www.cnblogs.com/lhb25/p/30-free-bootstrap-templates.html) and [管理系统模板](http://sudasuta.com/bootstrap-admin-templates.html) 快速搭建项目，简单，好看

### 遇上平衡木

在小跑上路的过程中，做出来的东西看起来很专业，注意是“看起来”。如果不理解真正的前端技能，那只能是看起来专业，内部结构还是乱糟糟的，或者是遇到bug不知道怎么调，东一句西一句，拆了东墙补西墙。这过程就像走在平衡木上，稍不留神就会摔下去。

#### 首先要了解css的布局原理

- [盒模型](/blog/2015/03/21/css-box-model/)
- [定位模型](/blog/2015/03/22/css-position-model/)
- 有了布局的基本理论后，尝试去理解Boostrap里的栅格系统 `row` `col` `span2` 背后的style

#### js最重要的三点: 闭包、原型、作用域

- [JS中的闭包及使用场合](/blog/2015/03/28/closure-in-js/)
- [使用闭包解决循环引用问题](/blog/2015/03/29/apply-closure-to-forloop/)
- [闭包、原型、作用域 面试整理](/blog/2015/04/22/some-interview-questions-of-javascript-2/)

关于js的原型和作用域，我没专门写过文章，建议去[博客园](http://www.cnblogs.com)搜下。如果想要完整的理解js语言机制，可以去看《Javascript模式》这本书，或者看我整理的读书笔记

- [《JavaScript模式》读书笔记系列](/tags.html#读书笔记-ref)

### 华丽跳跃谢幕

只有把平衡木上的技能磨熟练后，我们才能真正的游刃有余，保证不从平衡木上摔下来的前提下，再有余力去设计如何华丽的跳跃和谢幕。


组件封装
--------
还没了解js对类(或模块)的封装前，我们的代码可能是这样的

    var getData = function(){
        // ......
    };

    function editFunc(){
        // ......
    };

    $('.refresh-btn').on('click', function(){
        var data = getData();
        var $target = $($(this).attr('data-target'));
        $target.empty();

        for(var i=0; i<data.length; i++){
            var $child = $('<tr></tr>');
            $child.append('<td>' + data[i]['name'] + '</td>');
            // ......
            $child.append('<td><a class="edit-link">编辑</a></td>');
            $target.append($child);
        }

        $target.find('.edit-link').on('click', editFunc);
    });

一个点击就获取数据，然后刷新表格的功能。如果一个页面中有多个类似的异步刷新的表格，且每个表格的字段又各不相同，那么最偷懒的做法就是拷贝大段代码，然后再调整`<td>`的字段。这样的代码简直了，太难维护了！

    var table1 = AjaxTable({
        el: '#dataTable',
        dataUrl: '/path/to/action/'
    });

    table1.refresh();

如果代码变成这样，那就爽多了，获取数据和刷新表格的过程都封在了`AjaxTable`中，各个使用之处只需要传个参数调用下`refresh()`即可，减少了大量重复(相似的)代码。这就是对UI组件/功能组件的封装。

以前为了准备面试时的“手撕代码”，写过一个简单的轮播组件，不用jquery（面试经常不允许使用任何库）

- [原生js的Slider组件](/demo/js-native/slider/demo.html)

还写过下面一些文章

- [自己写的jquery分页插件](/blog/2015/03/03/step-by-step-jquery-plugin-pagination-1/)
- [为Highcharts做包装](/blog/2015/02/05/ajax-chart-for-highcharts/) （有点类似上面示例中的`AjaxTable`）
- [一步步做组件-学校选择器(系列)](/blog/2015/02/11/step-by-step-js-component-schoolbox-collections/) （系列长文，如何把一段生硬实现的代码一步一步封装和扩展成为一个可配置的UI组件）


模块化开发
---------
如果要在页面上引入外部的js库，最初学习的时候是这样引入的

    <script type="text/javascript" src="jquery-1.7.2.min.js"></script>
    <script type="text/javascript" src="jquery-ui/jquery-ui-1.8.24.min.js"></script>
    <script type="text/javascript" src="jquery-ui/jquery-ui-datepicker-zh-CN.js"></script>
    <script type="text/javascript" src="bootstrap-2.3.2.min.js"></script>

由于浏览器中js的执行(非加载)过程是在单线程中的，而各js文件又会存在依赖关系，比如 jquery-ui 依赖 jquery，bootstrap 也依赖 jquery，所以`<script>`标签的引入得满足依赖顺序。当一个项目越做页面越多时，这么多页面中会存在一堆`<script>`标签，如果要将某个js文件升级版本，或者修改script的依赖关系时，这就会成为一个很繁琐的工作，特别是`<script>`分散在项目的各个文件中时。

[RequireJS](http://www.requirejs.cn/)就是出来解决这个问题的，还有[SeaJS](https://github.com/seajs/seajs)，它们分别代表着**AMD**和**CMD**两种风格，关于[模块化和两者的区别可以看这篇文章](http://www.html-js.com/article/The-front-box-front-end-module)。

实战案例

- [用RequireJS包装AjaxChart](/blog/2015/02/07/wrap-ajaxchart-with-requirejs/)
- [前端模块化开发demo之攻击地图](/blog/2015/12/05/attack-map-with-amd/)


页面继承
--------


