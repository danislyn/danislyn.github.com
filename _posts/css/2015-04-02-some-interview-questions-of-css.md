---
layout: post
title: "几道CSS面试题"
description: 前一阵子参加了几轮电话面试，发现好多不足，赶紧mark下来，与大伙儿分享。先整理下CSS方面的。
category: css
tags: [css, 面试]
---
{% include JB/setup %}

横向布局
----------
问：可以用哪些CSS属性让一个个div一个接一个地横向排列？

我答：

- display: inline-block

- float: left（注意父元素塌陷）

- table布局（N前年的过时网站是这样子的，现在不推荐使用table布局，效率低）

- 使用absolute定位，一个个设好偏移应该也可以（我实在想不出了）

他提示说：有没有CSS3的属性也可以？

我：。。。

他换个问题：display有哪些取值？

- inline, block, inline-block

- table, table-row, table-cell类

- none, initial, inherit

仍然不是他想要的。。。


回头查资料：

- display还有felx, grid, inline-flex, inline-grid以及-webkit-box, -webkit-inline-box等CSS3的属性值。

回到最初的问题，让一个个div元素横向排列，还可以使用下面的办法。

- 对父元素设display: flex或-webkit-box（IE10下用-ms-flexbox）

- IE10+下对父元素设display: grid，子元素设grid-column和grid-row来实现grid layout



居中
------
问：如何让一个元素在它的父元素中水平、垂直居中？（经典的居中问题）

我答：

先来水平居中

- 子元素display: inline-block，然后父元素text-align: center

- 子元素设width，然后margin-left: auto, margin-right: auto

然后垂直居中

- 子元素是单行文本的话，直接line-height等于父元素height

- 子元素是多行文本或图文并排的话，父元素display: table-cell, vertical-align: middle


回头看笔记：

还有一种也可以实现水平居中，父元素设relative定位，子元素设absolute定位，子元素left: 50%，margin-left等于负1/2的width即可。模态框的居中一般使用这种办法。

    .mask{
        background-color: #666;
        height: 100%;
        left: 0;
        opacity: 0.3;
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 99;
    }
    .modal{
        background-color: #fff;
        height: 300px;
        left: 50%;
        margin-left: -200px;
        position: fixed;
        top: 120px;
        z-index: 100;
        width: 400px;
    }



边框
------
问：除了用border，还有什么其他属性可以画边框？只要让用户看起来像个边框即可。

我答：

- background，画个边框的图片

- box-shadow，阴影应该也能看起来像个边框吧。。。

想不出了，他进而问：box-shadow最多能画几条边框？

我：（这是什么鬼）。。。


回头查w3school：

- outline

- border-image，CSS3中支持的属性

边框从内到外的效果如下图

<img src="/assets/captures/20150402_01.jpg" style="max-width:160px;">

黄色的一片是background（其实是background-image）；蓝色和红色相间的菱形是border-image（同时设了border宽度和transparent）；绿色的方块是outline；右下边有一条灰色的阴影是box-shadow。

因此可以看到background只能填充到元素的`content + padding`，向外然后是border，而outline和box-shadow都在border之外。[demo在这里](/demo/css/border/demo.html)



float塌陷
-----------
问：你上面提到了float会导致父元素塌陷的问题，有哪些办法？

我答：

- 暴力法，父元素overflow: hidden，IE下要加一条`*zoom: 1`以触发hasLayout

- clearfix法

        .clearfix {
            *zoom: 1;
        }
        .clearfix:before,
        .clearfix:after {
            display: table;
            line-height: 0;
            content: "";
        }
        .clearfix:after {
            clear: both;
        }

接着问：IE下加`*zoom: 1`就够了吗？

我：。。。


回头查资料：

我觉得多设个zoom够了，只不过这只针对IE6，同时zoom是IE的私有属性。看了[对overflow与zoom”清除浮动”的一些认识](http://www.zhangxinxu.com/wordpress/2010/01/%E5%AF%B9overflow%E4%B8%8Ezoom%E6%B8%85%E9%99%A4%E6%B5%AE%E5%8A%A8%E7%9A%84%E4%B8%80%E4%BA%9B%E8%AE%A4%E8%AF%86/)，还有别的办法也能清除浮动。

- 父元素也float

- 父元素position: absolute

- 父元素display: inline-block

引用[absolute绝对定位的非绝对定位用法](http://www.zhangxinxu.com/wordpress/2010/01/absolute%E7%BB%9D%E5%AF%B9%E5%AE%9A%E4%BD%8D%E7%9A%84%E9%9D%9E%E7%BB%9D%E5%AF%B9%E5%AE%9A%E4%BD%8D%E7%94%A8%E6%B3%95/)中的一段话来解释这后三种清除浮动的原理：

> 浮动的本质就是“包裹与破坏”，破坏高度，浮动元素的实际占据高度为0；而absolute元素（无定位值）也是“包裹与破坏”，只是其“破坏”比float更加凶猛，不仅实际的高度没有，连实际的宽度也没有。



参考资料
---------
[CSS3 Grid Layout](http://www.w3cplus.com/css3/css3-grid-layout.html)

[CSS box-flex属性，然后弹性盒子模型简介](http://www.zhangxinxu.com/wordpress/2010/12/css-box-flex%E5%B1%9E%E6%80%A7%EF%BC%8C%E7%84%B6%E5%90%8E%E5%BC%B9%E6%80%A7%E7%9B%92%E5%AD%90%E6%A8%A1%E5%9E%8B%E7%AE%80%E4%BB%8B/)

[对overflow与zoom”清除浮动”的一些认识](http://www.zhangxinxu.com/wordpress/2010/01/%E5%AF%B9overflow%E4%B8%8Ezoom%E6%B8%85%E9%99%A4%E6%B5%AE%E5%8A%A8%E7%9A%84%E4%B8%80%E4%BA%9B%E8%AE%A4%E8%AF%86/)

[absolute绝对定位的非绝对定位用法](http://www.zhangxinxu.com/wordpress/2010/01/absolute%E7%BB%9D%E5%AF%B9%E5%AE%9A%E4%BD%8D%E7%9A%84%E9%9D%9E%E7%BB%9D%E5%AF%B9%E5%AE%9A%E4%BD%8D%E7%94%A8%E6%B3%95/)
