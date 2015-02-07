---
layout: post
title: "用RequireJS包装AjaxChart"
category: javascript
tags: [javascript, AMD]
---
{% include JB/setup %}

前面我写到AjaxChart，写到SchoolBox，我都在用javascript模拟“类”，提供一些接口让对象使用起来更加方便。javascript中的prototype和闭包、回调等等机制，可以完全用来实现“类”的封装。然而随着“类”规模的不断庞大，类中需要的依赖越来越复杂，如何有效的管理依赖关系也就成了一个问题。而RequireJS就是用来模拟“package”的，以管理“包”中的依赖。

<!-- break -->

问题由来
----------
在上一篇写[AjaxChart](/javascript/2015/02/05/ajax-chart-for-highcharts/)，它只是在Highcharts做了层包装，所以依赖于Highcharts，而Highcharts又依赖于jQuery，因此html引入的`<script>`会像这样。

    <script type="text/javascript" src="http://cdn.staticfile.org/jquery/1.7.2/jquery.min.js"></script>
    <script type="text/javascript" src="http://cdn.staticfile.org/highcharts/4.0.4/highcharts.js"></script>
    <script type="text/javascript" src="AjaxChart.js"></script>
    <script type="text/javascript">
    // main程序
    </script>

js的引入顺序一定要按照这个顺序，最后才是main程序。当程序越来越复杂时，它就需要更多的依赖，而依赖的对象本身之间可能又存在着依赖，这样到一定程度后依赖关系就会变得很头疼。



RequireJS
----------
[RequireJS](http://www.requirejs.cn/)是继jQuery以来前端界发生的最大成就之一，用于客户端的模块管理，它是符合[AMD规范](https://github.com/amdjs/amdjs-api/wiki/AMD)（Asynchronous Module Definition）的。而关于为何要采用AMD规范来写代码，可以看这篇[Writing Modular JavaScript With AMD, CommonJS & ES Harmony](http://addyosmani.com/writing-modular-js/)。RequireJS的基本思想就是，通过`define`方法，将代码定义为模块，而通过`require`方法，实现代码的模块加载。



调整代码结构
--------------

### 1. requirejs配置 ###

由于要依赖jQuery和Highcharts，我们先配置好。

    requirejs.config({
        baseUrl: 'js/lib',
        paths: {
            jquery: 'http://cdn.staticfile.org/jquery/1.7.2/jquery.min',
            highcharts: 'http://cdn.staticfile.org/highcharts/4.0.4/highcharts'
        },
        shim: {
            highcharts: {
                deps: ['jquery'],
                exports: 'Highcharts'
            }
        }
    });

这里`jquery`和`highcharts`均采用的是CDN上的，由于`highcharts`不是用`define`写的，所以要加一条`shim`来做转化。


### 2. 定义AjaxChart模块 ###

    define(['jquery', 'highcharts'], function($, Highcharts){
        // 以上省略...

        return AjaxChart;
    });

AjaxChart依赖于`jquery`和`highcharts`，最后返回`AjaxChart`对象。注意这里的文件名也要是`AjaxChart.js`。


### 3. 执行main程序 ###

    requirejs(['jquery', 'highcharts', 'AjaxChart'], function($, Highcharts, AjaxChart){
        // 省略...
    });

把这段程序放在`main.js`中，最后在页面中引入`<script type="text/javascript" src="js/require.js" data-main="js/app/main.js"></script>`即可。


附上目录结构

    - demo.html
    - js/
        - require.js
        - lib/
            - AjaxChart.js
        - app/
            - main.js


最后demo

[AjaxChart Demo](/demo/AjaxChart/v2/demo.html)
