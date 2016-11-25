---
layout: post
title: "常用模式片段之JS视窗"
category: javascript
tags: [javascript, 常用片段]
---
{% include JB/setup %}

继续【常用模式片段】系列的JS部分，首先整理了下关于滚动视窗的一些判定方法，经常用于做各种滚动相关的交互效果，比如滚动刷新，图片延迟加载（当图片位于视窗范围内才加载）

<!-- break -->

### 一、页面scrollTop

在jquery中直接`$(window).scrollTop()`就完事了，但也要知道在原生js中的兼容性写法为

```
window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
```

可参考如下

- [关于pageYOffset scrollY scrollTop的小结](http://www.cnblogs.com/freshbird/p/3422972.html)

- [stackoverflow中的问答](http://stackoverflow.com/questions/19618545/body-scrolltop-vs-documentelement-scrolltop-vs-window-pagyoffset-vs-window-scrol)


### 二、判断元素距离视窗的距离

元素距视窗顶部

> deltaTop = el.offset().top - 页面scrollTop

判断是否在当前视窗范围内的临界值

> (式1)  deltaTop - TOP_MARGIN > 0

元素距视窗底部

> deltaBottom = window.innerHeight - deltaTop - el.outerHeight()

判断是否在当前视窗范围内的临界值

> (式2)  deltaBottom - BOTTOM_MARGIN > 0

替换`deltaBottom`的计算式后，上式等价于

> (式3)  deltaTop < window.innerHeight - el.outerHeight() - BOTTOM_MARGIN

注：以上【TOP_MARGIN】【BOTTOM_MARGIN】表示距离视窗范围的固定量，类似于fixed定位时的 `top` `bottom` 所代表的距离。

综上，如果要判定一个元素是否在视窗范围内，只要同时满足 (式1)(式2/式3) 即可。


### 三、判断到达页面底部

在各种手机app上经常能看到到达页面底部后，就自动触发“下拉刷新”的交互。这里与上面类似但又有所不同

先定义两个值，表示整个文档的可见区域高度和可滚动距离（针对移动端的写法）

> viewHeight = document.documentElement.clientHeight

> scrollHeight = document.documentElement.scrollHeight

判定是否到达页面底部的临界值

> scrollHeight - window.pageYOffset - viewHeight < BOTTOM_MARGIN

这里【BOTTOM_MARGIN】表示距离页面底部的可接受距离。



附
----

### offsetHeight & clientHeight & scrollHeight

参考文章：[JavaScript中的各种宽高以及位置总结](https://segmentfault.com/a/1190000002545307)


### 几种窗口的宽度

document.documentElement.offsetWidth：视窗宽度（不滚动的情况下，一屏可以看到多宽的文档），且不包含滚动条的宽度

document.body.offsetWidth：页面文档真正的宽度，可以通过滚动看到的文档的全部宽度

window.innerWidth：同“视窗宽度”，但貌似在 IE8 下与 document.documentElement.offsetWidth 不相等

window.outerWidth：整个浏览器窗口的宽度，如果不开调试工具窗口，一般情况下其等于 `视窗宽度 + 滚动条宽度`

window.screen.width：整个屏幕的宽度，与你怎么拖拽窗口大小没有关系。。。

window.screen.availWidth：啥情况下会小于 `window.screen.width` ？(TODO)

