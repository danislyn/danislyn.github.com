---
layout: post
title: "浅谈HSV颜色模型"
description: "颜色模型是绘图的基础知识之一，除了用 RGB 表示颜色外，还有 CMY、HSV、HSL 等其他颜色模型。RGB 是用于电子设备显示的模型，CMY 是广泛用于印刷的颜色模型，而 HSV 更多是面向用户的颜色表达方式。"
category: 绘图
tags: [util]
---
{% include JB/setup %}

颜色模型来源
-----------
颜色模型最早来自美术和打印领域。“三原色”就是一种颜色模型，它来自美术上的概念，指“红/黄/蓝”，因为这三种颜色的配合可以调出除了黑白以外的几乎所有颜色，故称为三原色。

而在计算机/多媒体方面所说的“R/G/B”颜色模型其实是“三基色”，或者教科书上所说的“光的三原色”。红、绿、蓝三种光通过不同的组合，可以获得各种不同颜色光。而红、绿、蓝这三种光是无法用其他色光混合而成的，所以这三种色光叫做光的“三基色”。

### 物理解释

物理课上学过光的色散，肯定见过下面这个图。

<img src="/assets/captures/20160922_light_dispersion.jpg" style="max-width:400px">

可知白光是各种颜色的光叠加而成的，显然光的三原色是一种“加法”颜色模型。

光的颜色是直接进入人的眼睛，而人看到各种物体的颜色，其实是物体反射出的光的颜色。即红色的物体只会反射红色的光，其他颜色的光都被它吸收了；而黑色的物体吸收了所有颜色的光，人看不到它的反射光，所以看到的是黑色。

因此被物体吸收的颜色，其实是`所有颜色 - 物体反射的颜色`，当颜料叠加时，也遵从了`所有颜色 - Σ(反射的颜色)`，可以理解为一种“减法”颜色模型。


常用颜色模型
-----------

### RGB

即光的三原色，如下图。

<img src="/assets/captures/20160922_rgb_colors.jpg" style="max-width:200px">

RGB 颜色模型可以理解为一个立方体的模型，R/G/B 分别代表三维坐标系中的 x/y/z 轴，而原点表示什么颜色都没有(即黑色)

<img src="/assets/captures/20160922_rgb_cube.png" style="max-width:300px">

在计算机多媒体领域中，通常将 R/G/B 三个值标准化到 0~255 的整数区间上，因为这样一个颜色分量共有256个取值，正好可以用一个字节表示。这样 R/G/B 共可组成 `2^24` 种颜色，当然远远超过了人眼能够分辨的颜色数目。


### CMY

第一节中提到的美术/印刷领域用的三原色，其实就是 CMY 颜色模型。

<img src="/assets/captures/20160922_cmy_colors.jpg" style="max-width:200px">

在印刷领域也会用 CMYK 模型，表示青(Cyan)品红(Magenta)黄(Yellow)黑(BlacK)四种颜料，就是在 CMY 的基础上也将黑色作为基础颜色，因为打印时由品红、黄、青合成的黑色不够纯粹。

从上面可以看到 CMY 和 RGB 的颜色合成图有点类似，`R`和`B`可以成`品红`。这里要说明下，RGB 颜色是越叠加越亮(越接近白色)，而 CMY 颜色是越叠加越暗(越接近黑色)，这就是“加法混色模型”和“减法混色模型”的区别。


### HSV

HSV 使用六角锥体模型来表示 色调（Hue）、饱和度（Saturation）、明度（Value）。

<img src="/assets/captures/20160922_hsv_model.jpg" style="max-width:200px">

用角度来表示色调`H`，取值范围为0°～360°，从红色开始按逆时针方向计算，红色为0°，绿色为120°，蓝色为240°。它们的补色是：黄色为60°，青色为180°，品红为300°。

饱和度`S`表示颜色接近光谱色的程度，通常取值范围为0%～100%，值越大，颜色越饱和。而`S=0`时，只有灰度。

明度`V`表示颜色明亮的程度，通常取值范围为 0%（黑）到 100%（白）

> HSV 模型的三维表示从 RGB 立方体演化而来。设想从 RGB 沿立方体对角线的白色顶点向黑色顶点观察，就可以看到立方体的六边形外形。六边形边界表示色彩，水平轴表示纯度，明度沿垂直轴测量。

<img src="/assets/captures/20160922_hsv_from_cube.png" style="max-width:400px">


### HSL

HSL 和 HSV 很相似，它们都是面向用户的颜色模型，定义了：色调(色相)、饱和度、明度(亮度)。相信大家在调节电视或显示器屏幕颜色时都会看到这几个名词吧！

关于更多 HSL 和 HSV 的区别请参见 [维基词条：HSL和HSV色彩空间](https://zh.wikipedia.org/wiki/HSL%E5%92%8CHSV%E8%89%B2%E5%BD%A9%E7%A9%BA%E9%97%B4)


颜色模型转化
-----------

### RGB to HSV

由 RGB 转换为 HSV 时，设`max`为 r/g/b 中的最大值，`min`为 r/g/b 中的最小值。转换公式如下

<img src="/assets/captures/20160922_rgb_to_hsv.png" style="max-width:400px">

**js 实现如下**

```
rgb2hsv: function () {
    // 读取 rgb
    var rgb = this.parseRgbArguments.apply(null, arguments);
    var r = rgb.r;
    var g = rgb.g;
    var b = rgb.b;

    // rgb 分量的最大最小值
    var max;
    var min;

    if (r > g) {
        max = Math.max(r, b);
        min = Math.min(g, b);
    }
    else {
        max = Math.max(g, b);
        min = Math.min(r, b);
    }

    var delta = max - min;

    // hsv 分量
    var v = max;
    var s = (v === 0.0) ? 0.0 : delta / v;
    var h;

    if (s === 0.0) {
        h = 0.0;
    }
    else {
        if (r === max) {
            h = 60.0 * (g - b) / delta;
        }
        else if (g === max) {
            h = 120 + 60.0 * (b - r) / delta;
        }
        else {
            h = 240 + 60.0 * (r - g) / delta;
        }

        // 修正色调 ( 0~360 度)
        if (h < 0.0) {
            h += 360.0;
        }
        if (h > 360.0) {
            h -= 360.0;
        }
    }

    h = Math.round(h);
    s = Math.round(s * 255.0);
    v = Math.round(v);

    // avoid the ambiguity of returning different values for the same color
    if (h === 360) {
        h = 0;
    }
    // 注: s,v 分量值域为 0~255
    return {
        h: h,
        s: s,
        v: v
    };
}
```

注意：因为`v = max(r,g,g)`，这里我将`v`和`s`也转到了`0~255`的区间上，而`h`的值域为`0~359`。


### HSV to RGB

由HSV转换为RGB时，如果饱和度`s = 0`，则颜色是非彩色的，色调(Hue)是无意义的，此时`r=g=b=v(亮度)`。

如果饱和度`s ≠ 0`，有如下的计算方式：

<img src="/assets/captures/20160922_hsv_to_rgb.png" style="max-width:300px">

**js 实现如下**

```
hsv2rgb: function () {
    // 读取 hsv
    var hsv = this.parseHsvArguments.apply(null, arguments);
    var h = hsv.h;
    var s = hsv.s;
    var v = hsv.v;

    // rgb 分量
    var r;
    var g;
    var b;

    // 特殊处理
    if (s === 0) {
        r = v;
        g = v;
        b = v;
    }
    else {
        // 原始亮度
        var value = v;
        // s,v 分量归一化
        var s = s / 255.0;
        var v = v  / 255.0;

        // 修正后的 h 分量
        var hFix = (h === 360) ? 0 : h / 60;
        var hIndex = Math.floor(hFix);
        var hLeft = hFix - hIndex;

        // v 分量转化的中间变量
        var vs = v * s;
        var vLeft  = value - value * s;

        switch (hIndex) {
            case 0:
                var vTemp = v - vs * (1 - hLeft);
                r = Math.round(value);
                g = Math.round(vTemp * 255.0);
                b = Math.round(vLeft);
                break;

            case 1:
                var vTemp = v - vs * hLeft;
                r = Math.round(vTemp * 255.0);
                g = Math.round(value);
                b = Math.round(vLeft);
                break;

            case 2:
                var vTemp  = v - vs * (1 - hLeft);
                r = Math.round(vLeft);
                g = Math.round(value);
                b = Math.round(vTemp * 255.0);
                break;

            case 3:
                var vTemp = v - vs * hLeft;
                r = Math.round(vLeft);
                g = Math.round(vTemp * 255.0);
                b = Math.round(value);
                break;

            case 4:
                var vTemp = v - vs * (1 - hLeft);
                r = Math.round(vTemp * 255.0);
                g = Math.round(vLeft);
                b = Math.round(value);
                break;

            case 5:
                var vTemp = v - vs * hLeft;
                r = Math.round(value);
                g = Math.round(vLeft);
                b = Math.round(vTemp * 255.0);
                break;
        }
    }

    return {
        r: r,
        g: g,
        b: b
    };
}
```

详见 [完整代码](/demo/ColorUtil/colorUtil.js) 和 [测试用例](/demo/ColorUtil/testcase.html)


### 参考

- 在线转化工具：[http://www.kmhpromo.com/rgbtopms/cmyktopantone.html](http://www.kmhpromo.com/rgbtopms/cmyktopantone.html)
- 更多颜色模型：[http://blog.ibireme.com/2013/08/12/color-model/](http://blog.ibireme.com/2013/08/12/color-model/)

