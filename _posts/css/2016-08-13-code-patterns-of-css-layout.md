---
layout: post
title: "常用模式片段之CSS布局篇"
category: css
tags: [css, 常用片段]
---
{% include JB/setup %}

去年在杭州实习的三个多月收获颇多，不管是代码层面还是思考层面，发现了自己很多一知半解的缺点，正应了墨菲法则，会出错的事总会出错。现在重新整理那时的学习笔记，以备今后之需。

<!-- break -->

注：此为初稿笔记，未二次提炼。

position 拉伸
-------------

### 撑满整个未知宽高容器

```css
position: absolute;
top: 0; bottom: 0; left: 0; right: 0;
```

### 撑满整个屏幕

```css
position: fixed;
top: 0; bottom: 0; left: 0; right: 0;
```

注：是元素撑满，如果只是背景撑满，只需对根节点设background


居中
-----

### 水平居中

已知元素宽度

```css
#parent {
	position: relative;
}
#content {
	position: absolute;
	left: 50%;
	margin-left: -200px;  // 负 (width/2)
	width: 400px;
}
```

未知元素宽度

```css
#parentWrapper {
    position: relative;
    overflow: hidden;
}
#parent {
    float: left;
    position: relative;
    left: 50%;
}
#content {
    float: left;
    position: relative;
    right: 50%;
}
```

[demo效果](/demo/css/layout/floatCenter.html)


浮动
-----

### 完备的clearfix

```css
.clearfix() {
    *zoom: 1;
    &:before,
    &:after {
        display: table;
        content: "";
        // Fixes Opera/contenteditable bug:
        // http://nicolasgallagher.com/micro-clearfix-hack/#comment-36952
        line-height: 0;
    }
    &:after {
        clear: both;
    }
}
```

### 左侧菜单 右侧主体

左侧定宽，右侧元素自适应铺满

- 左侧元素定宽，并浮动
- 右侧元素设`oerflow: hidden`
- 父容器可定宽，也可100%铺满


BFC (block formatting context)
-------------------------------

- block-level box 须通过设置如overflow不为visible(IE6/7无效，可以设zoom)、float不为none等等来创建block formatting context
	
- 触发了bfc的block level box，没有margin callapse的问题（父元素与子元素的margin callapse），并且边缘不会和float box的边缘重叠，利用它可以清浮动。

- 页面上任何一个元素都可以看成box，box分block-level，inline-level和匿名的
	
- W3C标准 [Visual formatting model](http://www.w3.org/TR/CSS2/visuren.html)


行排列
------

### inline-block 间隙

- inline-block之间是会有一个默认间隙的，跟父元素font-size有关，设为0就可以了
	
- 老safari下还需设letter-spacing、word-spacing一个负值(0.25em左右)，子元素设为normal
	
- block之间没有间隙
	

### inline-block 行高

- 父元素block，子元素inline-block时，子元素会有一定行高，导致父元素的高度与子元素实际内容的高度不一致
	
- 父元素设font-size: 0，同时IE下再设line-height: 0


### 子元素横向排列边距

- 子元素都设 margin-right，而最边上的元素需要修正，用 nth-child 会有兼容性问题

- 父元素设个 margin-right 负值，可将一行的子元素全包进去


文字排列
--------

### 文字竖排

- 文本元素设`width: 1.5em`
- 再对父容器设文本居中

### 最小字体

实现10px的文字大小，而部分浏览器比如chrome只支持最小12px的文字。

```css
transform-origin: 0 50%;
transform: scale(10/12);
```

注：元素占据的位置不会缩小，仅仅是看上去缩小了

### 文字overflow 显示'...'

单行文字

```css
.ui-text-overflow(){
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
```

多行文字（仅webkit有效）

```css
.ui-text-overflow-lines(@line: 2, @lineHeight: 1.5){
    display: -webkit-box;
    -webkit-line-clamp: @line;
    -webkit-box-orient: vertical;
    overflow: hidden;
    @height: @lineHeight * @line;
    max-height: ~'@{height}em';
}
```

注：该元素本身不要设上下padding，要垂直居中请在父元素上控制


背景
-----

### 背景图固定不跟随滚动

```css
background-attachment: fixed
```


其他
-----

### 手绘icon

这是一个类似`√`符号的icon，css绘制出来，支持等比缩放。

```css
.icon-get{
    background-color: #59b726;
    border-radius: 50%;
    color: #fff;
    display: block;
    height: 18px;
    width: 18px;
    position: absolute;
    top: -10px;
    left: -10px;
    transform: rotate(-45deg);

    &::before,
    &::after{
        content: ' ';
        display: block;
        position: absolute;
    }
    &::before{
        border-top: 1px solid #fff;
        width: percentage(11/18);
        top: percentage(11/18);
        left: percentage(5/18);
    }
    &::after{
        border-left: 1px solid #fff;
        height: percentage(7/18);
        top: percentage(4/18);;  //before.top - after.height
        left: percentage(5/18);
    }
}
```

### 自定义滚动条样式

类似mac上滚动条的感觉

```
.mac-scroll {
    &::-webkit-scrollbar {
        width: 8px;
    }
    /*定义滑条*/
    &::-webkit-scrollbar-thumb {
        background-color: $gray-lightest;
        background-clip: content-box;
        border-top: 5px solid rgba(255,255,255,0);
        border-bottom: 5px solid rgba(255,255,255,0);
        border-right: 4px solid rgba(255,255,255,0);
    }
    /*定义滚动条轨道*/
    &::-webkit-scrollbar-track {
        background-color: #fbfbfb;
    }
}
```
