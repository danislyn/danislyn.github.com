---
layout: post
title: "常用模式片段之CSS兼容性"
category: css
tags: [css, 常用片段]
---
{% include JB/setup %}

续前面的[CSS布局篇](/blog/2016/08/13/code-patterns-of-css-layout)，这里整理一些需求下的浏览器兼容性写法。

<!-- break -->

色彩滤镜
--------

### opacity

```css
/* IE 8 */
-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
	
/* IE 5-7 */
filter: alpha(opacity=50);
	
/* Netscape */
-moz-opacity: 0.5;
	
/* Safari 1.x */
-khtml-opacity: 0.5;
	
/* Good browsers */
opacity: 0.5;
```

### 灰白滤镜

```css
.grayscale(){
    filter: gray; /* For IE 6 - 9 */
    filter: progid:DXImageTransform.Microsoft.BasicImage(grayscale=1); 
    filter: url("data:image/svg+xml;utf8,&lt;svg xmlns=\'http://www.w3.org/2000/svg\'&gt;&lt;filter id=\'grayscale\'&gt;&lt;feColorMatrix type=\'matrix\' values=\'0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0\'/&gt;&lt;/filter&gt;&lt;/svg&gt;#grayscale"); /* Firefox 10+, Firefox on Android */
    filter: grayscale(100%); /* For Standard */
    -webkit-filter: grayscale(100%); /* Chrome 19+, Safari 6+, Safari 6+ iOS */
    -webkit-filter: grayscale(1);
    -moz-filter: grayscale(100%);
    -ms-filter: grayscale(100%);
    -o-filter: grayscale(100%);
}
```


居中问题
--------

### table-cell 垂直居中

```css
.table {
    height: 300px;/*高度值不能少*/
    width: 300px;/*宽度值不能少*/
    display: table;
    position: relative;
    float:left;
}
.tableCell {
    display: table-cell;
    vertical-align: middle;
    text-align: center;         
    padding: 10px;
    *position: absolute;
    *top: 50%;
    *left: 50%;
}
.content {
    *position:relative;
    *top: -50%;
    *left: -50%;
}
```


行排列
------

### inline-block IE6/7 hack

```css
*display: inline;
*zoom: 1;
```


未完待续
--------
请持续关注~

