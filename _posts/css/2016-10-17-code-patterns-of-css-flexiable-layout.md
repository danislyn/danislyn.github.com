---
layout: post
title: "常用模式片段之CSS弹性布局"
category: css
tags: [css, 常用片段]
---
{% include JB/setup %}

续前面的[CSS布局篇](/blog/2016/08/13/code-patterns-of-css-layout)，这篇针对移动端布局的特点整理了几种弹性布局的案例。

<!-- break -->

百分比布局
---------
相较于写死像素绝对值的布局，百分比布局是最简单的实现弹性布局的方式，只需将原来宽度的绝对大小都替换成百分比即可。

```css
.layout-container {
    background: #eee;
    padding: 5px;
    font-size: 0;

    .box {
        box-sizing: border-box;
        display: inline-block;
        height: 80px;
        padding: 5px;
        width: percentage(1/3);

        .inner {
            background: #ccc;
            height: 100%;
            width: 100%;
        }
    }
}
```

注：部分手机浏览器无法计算到很精确的percentage，在四舍五入时会出现问题，比如总宽度超过了100%就会将最后一个元素挤到下一行去。因此将上述`percentage(1/3)`改为`33.3%`即可。


flex 布局
---------
关于flex布局的教程请看：[一个完整的Flexbox指南](http://www.w3cplus.com/css3/a-guide-to-flexbox-new.html)

```css
.flexbox(){
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;

    -webkit-box-lines: multiple;
    -moz-box-lines: multiple;
    -ms-flex-wrap: wrap;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;

    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
    -moz-box-orient: horizontal;
    -moz-box-direction: normal;
    -ms-flex-direction: row;
    -webkit-flex-direction: row;
    flex-direction: row;

    &.vertical{
        -webkit-box-orient: vertical;
        -moz-box-orient: vertical;
        -ms-flex-direction: column;
        -webkit-flex-direction: column;
        flex-direction: column;
    }
}

.flex(@grow, @shrink, @basis){
    -webkit-box-flex: @grow;
    -moz-box-flex: @grow;
    -ms-flex: @grow @shrink @basis;

    -webkit-flex-grow: @grow;
    -webkit-flex-shrink: @shrink;
    -webkit-flex-basis: @basis;
    -webkit-flex: @grow @shrink @basis;

    flex-grow: @grow;
    flex-shrink: @shrink;
    flex-basis: @basis;
    flex: @grow @shrink @basis;
}

.order($val) {
    -webkit-box-ordinal-group: $val;  
    -moz-box-ordinal-group: $val;     
    -ms-flex-order: $val;     
    -webkit-order: $val;  
    order: $val;
}

.layout-container{
    background: #eee;
    padding: 5px;

    .flexbox();
    &, *, *:after, *:before {
        box-sizing: border-box;
    }

    .box{
        background: #ccc;
        height: 80px;
        margin: 5px;
        .flex(1, 1, 0);  /*flex-basis在老webkit下不生效*/
        width: 0;  /*android有些浏览器下面如果重置宽度，不会通过flex来计算宽度*/
        max-width: 100%;
        display: block;
        /*padding: 0 !important;*/
        /*position: relative;*/
    }
}
```


弹性图片
--------
弹性图片的需求是当屏幕尺寸变化时，图片保持等比缩放，且不能出现文档高度的抖动。

```
<div class="item">
	<div class="img-wrapper">
		<img src="http://img.taobaocdn.com/tfscom/TB1Fhi3HVXXXXXlXpXXSutbFXXX_q50.jpg">
	</div>
</div>
```

```css
.item{
	float: left;
	width: 50%;
}
.img-wrapper{
	margin: 0 10px 10px 0;
	position: relative;
}
.img-wrapper::before{
	content: '';
	display: block;
	padding-top: 30%;
}
.img-wrapper img{
	height: 100%;
	left: 0;
	position: absolute;
	top: 0;
	width: 100%;
}
```
		
原理
	
- padding 的百分比值都是参照父元素的 width 计算出的

- absolute 元素的 width、height 百分比值也是参照最近 relative 父元素的

- 通过在 img 父元素内做个伪类，用`padding-top`将父元素撑起来，`padding-top`的百分比等于图片的高宽比。这样当图片未载入时，也预留出图片的占位，不会产生文档高度的跳动。

[demo效果](/demo/css/layout/flexiableImg.html)


两列同步拉伸
-----------
弹性图片的需求再进一步，需要实现等比缩放的两列布局，可以是图片，也可以是图文混排。（可参考双11商品活动页的移动端展现）

```
<div class="box banner">
    <div class="box-inner">
        <img class="banner-img" src="http://gtms04.alicdn.com/tps/i4/TB1BHIGHFXXXXbHXFXXTYq7_VXX-240-347.jpg">
    </div>
</div>
<div class="box item">
    <div class="box-inner"></div>
</div>
```

```css
@cellPadding: 10px;
@cellRatio: percentage(275/160);  //图片高宽比
.box{
    background: #fff;
    border: 1px solid #000;
    border-width: 0 1px 1px 0;
    border-radius: 0;
    box-sizing: border-box;

    float: left;
    position: relative;
    padding: @cellPadding;
    width: 50%;
}
.box::before{
    content: ' ';
    display: block;
    padding-top: @cellRatio;
}
.box:nth-of-type(2n){
    border-right-color: transparent;
}
.box:last-of-type,
.box:nth-last-of-type(2){
    border-bottom-color: transparent;
}

.box-inner{
    position: absolute;
    top: 10px;
    left: 10px;
    bottom: 10px;
    right: 10px;
}
.banner-img{
    height: 100%;
    width: 100%;
}
.item .box-inner{
    background: #f35656;
}
```

移动端布局特点：

- 绝对定位时不要写死px，用百分比，或者同时设置top left bottom right
- 要考虑到屏幕resize和旋转的情况

[demo效果](/demo/css/layout/flexiableCols.html)


