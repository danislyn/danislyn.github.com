---
layout: post
title: "前端要给力 — 平凡之路"
category: 思考
tags: [前端]
---
{% include JB/setup %}

一直想总结下自己摸打滚爬的前端经历，3年，从一个极讨厌前端的人，变成一个吃前端饭碗的人。没有人带过我，跌跌撞撞的缓慢前进，但我很喜欢分享，喜欢一起进步，这会是我以后一直乐意做的事情。

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

    var table1 = new AjaxTable({
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

[RequireJS](http://www.requirejs.cn/)就是出来解决这个问题的（简单来说就是用js去管理js），还有[SeaJS](https://github.com/seajs/seajs)，它们分别代表着**AMD**和**CMD**两种风格，关于[模块化和两者的区别可以看这篇文章](http://www.html-js.com/article/The-front-box-front-end-module)。

### 实战案例

- [用RequireJS包装AjaxChart](/blog/2015/02/07/wrap-ajaxchart-with-requirejs/)
- [前端模块化开发demo之攻击地图](/blog/2015/12/05/attack-map-with-amd/)


页面继承
--------
*页面继承* 这块跟上面的各种具体的技术没太大关系，页面继承主要是用来组织项目文件结构（或页面结构）的一些经验规则。假设在一个系统里，每个页面都有相同的头和尾，还有nav，那根据上面封装和分离的思想，我们可能会这样写

    <html>
    <body>
        %{ include header.html }%

        <div class="container">
            <div class="left">
                %{ include nav.html }%
            </div>
            <div class="main">
                <!-- 具体业务... -->
            </div>
        </div>
        
        %{ include footer.html }%

        <script src="require.min.js"></script>
        <script type="text/javascript">
        requirejs.config({
            // 全局配置...
        });
        </script>

        <script type="text/javascript">
        require(['jquery'], function($){
            // 具体业务...
        });
        </script>
    </body>
    </html>

我们可以把这一段作为一个base的父页面，命名为`base.html`，每个“具体业务”的页面都继承自它。

	%{ extends 'base.html' }%
	
	%{ block styles }%
	<style type="text/css">
	
	</style>
	%{ endblock }%
	
	%{ block content }%
	<div>具体业务...</div>
	%{ endblock }%
	
	%{ block scripts }%
	<script type="text/javascript"
	require(['jquery'], function($){
        // 具体业务...
    });
	</script>
	%{ endblock }%

把这个页面叫做`func1.html`，具体业务的页面中只会包含自身业务功能需要关心(用到)的东西，不去多管base页面的闲事。可以看到子页面中有很多`block`之类的锚点，会将与`endblock`之间的内容插入到父页面中的相应位置，所以要先在`base.html`中“挖好坑”。

	%{ block styles }% %{ endblock }%
	%{ block content }% %{ endblock }%
	%{ block scripts }% %{ endblock }%

具体做法可以去看常见的模板系统，本例中参考的是[Django](https://docs.djangoproject.com/en/1.9/ref/templates/language/)中的模板定义。


页面组件化
---------
*页面组件化* 也是和具体技术没有关系，它是顺着 *页面继承* 的思路，把页面或文件结构做更小粒度的拆分，页面由一个个页面组件构成。

    %{ include sectionA.css }%
    %{ include sectionB.css }%

    <div class="row">
        %{ include sectionA.tpl }%
    </div>
    <div class="row">
        %{ include sectionB.tpl }%
    </div>
    
    <script type="text/javascript">
    require(['sectionA', 'sectionB'], function(A, B){
        var App = Base.extend({
            _init: function(){
                var that = this;
                var mods = [A, B];
                this.modules = [];
                
                mods.forEach(function(Module){
                    that.modules.push(new Module(App));
                });
            }
        });
    });
    </script>

上面相当于一个业务页面，它由`sectionA`和`sectionB`两个页面组件组成，`sectionA.tpl`和`sectionB.tpl`是html模板。在应用层(即业务)页面中初始化两个js模块`A`和`B`，并且把自身的`App`变量传递给模块（`new Module(App)`），可以实现子模块与应用层页面的通信，甚至是模块之间的通信。

这样把页面拆成粒度更细的结构，好处是页面模块可以复用，也便于管理，改动页面中的一小块时只需在所处的模块中，缩小改动的影响范围。

还看过一种思想是，把css文件也当做资源由requireJS动态加载，这样上面示例中的`include xxx.css`都不需要了，页面模块的css资源作为该模块的依赖，写在js模块的`define`的依赖中。

	define(['jquery', 'sectionA.css'], function($){
	    // 业务模块...
	});

这样把css和js都抽象成“资源”，相当于

> 组件 = 模板 + 资源

一个页面整体的模板，相当于多个页面组件的拼装而成。更进一步，如果能让页面组件做到**异步渲染**的话（即可以由js去解析模板语法和变量，而不是交给web框架），才能真正做到页面渲染的本质：

> 呈现给用户的页面 = 页面模板 (包括组件的模板) + 数据

“渲染”就是将带数据变量的页面模板输出成标准的html，同步渲染是指在服务端解析模板并输出完整html到浏览器中，而异步渲染指直接在浏览器中通过javascript 根据传入的数据将模板输出成标准html。同一模板如果既能在服务端同步渲染，又能在浏览器端异步渲染的话，我们就不需要关心“数据”是后端框架直接输出到页面的，还是ajax动态取来的，数据对模板来说就是个“接口”。这样我们作为前端，才能把更多精力放在模板和交互上，不用管数据的传递方式。


平凡之路
--------
前端发展了十几年，现在几乎到达顶峰的速度了，近两年推出的框架层出不穷，jquery早已不是一统江湖了。每个人的精力都有限，不可能一个个都学过来，但是必须承认，[前端是一个完整的体系](/blog/2015/09/20/fe-review-points/)(我之前整理的知识体系)，有它独特和魅力之处。不仅是框架，还有更多的工程化问题，框架都是为了解决某类相通的问题而生。模板和数据分离也好，“状态”和“表现”分离也好，我越来越体会到

> “分”是为了“合”

这条平凡之路，还会“频繁”的发展和融合下去。
