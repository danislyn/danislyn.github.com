---
layout: post
title: "一步步做组件-学校选择器(系列)"
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

前一段时间整理完了SchoolBox这个系列的代码和文章，这里再做个合集，方便大家找到相应的篇目。我总共整理了10个版本（后来补充了3个版本）的代码和8篇（后来新增了2篇）文章，分别如下。

<!-- break -->


### 版本1 ###

只是简单的界面设计，静态排版，没有js部分。

Demo：[demo v1](/demo/SchoolBox/v1/demo.html)

文章：[穿插在第一篇中](/blog/2015/01/18/step-by-step-js-component-schoolbox-1#section-1)



### 版本2 ###

加入了js部分，实现了省和学校的级联。

Demo：[demo v2](/demo/SchoolBox/v2/demo.html)

文章：[一步步做组件-学校选择器(1)](/blog/2015/01/18/step-by-step-js-component-schoolbox-1)



### 版本3 ###

把版本2的js代码写成组件的结构。

Demo：[demo v3](/demo/SchoolBox/v3/demo.html)

文章：[一步步做组件-学校选择器(2)](/blog/2015/01/19/step-by-step-js-component-schoolbox-2)



### 版本4 ###

添加自定义事件，即使用观察者模式。

Demo：[demo v4](/demo/SchoolBox/v4/demo.html)

文章：[一步步做组件-学校选择器(3)](/blog/2015/01/20/step-by-step-js-component-schoolbox-3)



### 版本5 ###

加入学校搜索框的功能，使用的是本地数据，也可以Ajax请求。

Demo：[demo v5](/demo/SchoolBox/v5/demo.html)

文章：[一步步做组件-学校选择器(4)](/blog/2015/01/25/step-by-step-js-component-schoolbox-4)



### 版本6 ###

为搜索结果添加按键效果，即通过“上”“下”键选中，“回车”键确定。

Demo：[demo v6](/demo/SchoolBox/v6/demo.html)

文章：[一步步做组件-学校选择器(5)](/blog/2015/01/26/step-by-step-js-component-schoolbox-5)



### 版本7 ###

附加功能，添加自定义学校。

Demo：[demo v7](/demo/SchoolBox/v7/demo.html)

文章：[一步步做组件-学校选择器(6)](/blog/2015/01/27/step-by-step-js-component-schoolbox-6)



### 版本8（后增） ###

实现学校选择器的模态对话框，并在页面中共用同一个选择器对象。

Demo：[demo v8](/demo/SchoolBox/v8/demo.html)

文章：[一步步做组件-学校选择器(7)](/blog/2015/02/25/step-by-step-js-component-schoolbox-7)



### 版本9 & 10（补充） ###

页面上多个元素共享同一个模态对话框，在触发事件时加入“由哪个监听元素触发”，以避免对所有监听元素都做出响应。

监听时判断，Demo：[demo v9](/demo/SchoolBox/v9/demo.html)

回调时判断，Demo：[demo v10](/demo/SchoolBox/v10/demo.html)

文章：[一步步做组件-学校选择器(8)](/blog/2015/04/04/step-by-step-js-component-schoolbox-8)



*最后谢谢大家~~*