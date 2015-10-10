---
layout: post
title: "从弹出层引出的对滚动原理的讨论"
category: mobile
tags: [mobile, javascript, css]
published: false
---
{% include JB/setup %}

上一篇为了解释移动端web的事件和点击穿透问题，我做了一个弹出框做例子，[见demo](/demo/touch-event/problem.html)。现在请把关注点转移到弹出层本身上来，我使用fix定位将它定在屏幕中间，滚动屏幕时发现问题没有，底层元素还是在滚动，只是弹出层在屏幕正中间而且周围有遮罩。所以我们就“滚动”这件事详细说说，可能存在哪些滚动需求。

<!-- break -->

页面滚动原理
------------



滚动禁用
---------

### overflow ###



### 禁用事件 ###



弹出层滚动需求
-------------

弹出层内部可滚，但底层元素不能滚



iscroll的滚动
--------------

https://github.com/cubiq/iscroll/blob/master/src/core.js



参考资料
---------
http://www.zhihu.com/question/21865401

http://output.jsbin.com/disable-scrolling/1