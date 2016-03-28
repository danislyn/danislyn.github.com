---
layout: post
title: "为Highcharts做包装"
category: javascript
tags: [javascript, chart]
---
{% include JB/setup %}

**Highcharts**是一个用纯JavaScript编写的一个图表库，能够很简单便捷的在web网站或是web应用程序添加有交互性的图表，并且免费提供给个人学习、个人网站和非商业用途使用（摘自百度百科）。另外HighCharts还有很好的兼容性，能够完美支持当前大多数浏览器，现在官方的最新版本为Highcharts-4.0.4。

<!-- break -->


问题来源
----------
我在很早一篇[使用PhantomJs对网页截图](/blog/2014/06/12/use-phantomjs-to-capture-webpage)中就提到了Highcharts，那时用它在网页上绘制图表，然后用[Phantomjs](http://phantomjs.org/)去截图，因为我想让服务端只负责生成数据，而让客户端去生成图表及图片。在那个项目中，所有的图表都是通过Ajax取来数据后，再调用Highcharts生成图表的。而常用的图表类型也无非那几种，每次都要先Ajax请求，然后构造highcharts的一堆配置参数。

    $.post(
        'someAjaxUrl',
        {
            param1: 'value1'
        },
        function(data){
            $('#container').highcharts({
                chart: { type: 'line' },
                title: null,
                xAxis: { ... },
                yAxis: { ... },
                tooltip: { ... },
                legend: { ... },
                series: data
            });
        }
    );

因为服务端只返回`series`里要求的数据格式，尽量与highcharts的配置降低耦合，所以前台每次想要生成一个图表都要写一段上面类似的代码。因此我觉得有必要对highcharts做简单的包装，让它更加简单的配合Ajax和chart type。



接口设计
---------
我们希望可以这样使用chart

    var chart1 = new AjaxChart({
        container: '#chartDemo1',
        chartType: 'line'，
        ajaxUrl: 'someAjaxUrl',
        ajaxParams: {
            param1: 'value1',
            param2: function(){
                return 'value2';
            }
        }
    });

    chart1.refresh();

传入图表的container元素和chart type，传入ajax url和params，且这里的params既可以是个值，也可以是个function。最后通过`refresh()`接口生成图表。这样可以把`chart1.refresh()`放到某个按钮的`click`或`change`事件里，以实现根据用户的选择动态刷新图表。



全局配置
---------
针对几种常用的图表类型，折线图、饼图、柱状图、区域图，我们分别为此定义默认的Highcharts配置属性。

    var CHART_OPTIONS = {
        // 全局Highcharts配置
        global: {
            title: null,
            xAxis: {
                // NOTE: 这里假设每个series的数据项都一样，因此取第一个series来作为分类即可。
                categories: function(){
                    var categories = [];
                    // 用data数组生成categories
                    if(series[0].data[0] instanceof Array){
                        $.each(series[0].data, function(k, v){
                            categories.push(v[0]);
                        });
                    }
                    return categories;
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: {point.y}'
            },
            legend: {
                enabled: false
            },
            yAxis: {
                title: {
                    enabled: false
                }
            }
        },

        // 折线图配置项
        line: {
            chart: { type: 'line' },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    }
                }
            }
        },

        // 饼图配置项
        pie: {
            chart: { type:'pie' },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: {point.percentage:, .1f}%'
            }
        },

        // 柱形图配置项
        column: {
            chart: { type:'column' },
            plotOptions: {
                column: {
                    dataLabels: {
                        enabled: true
                    }
                },
                series: {
                    groupPadding: 0,
                    pointPadding: 0
                }
            }
        },

        // 区域图
        area: {
            chart: { type:'area' },
            plotOptions: {
                area: {
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    }
                }
            }
        }
    };



AjaxChart构造
--------------
根据上面的接口设计，我们可以写出这样的代码框架。

    var AjaxChart = function(config){
        this._container = config.container;
        this._chartType = config.chartType;
        this._url = config.ajaxUrl;
        this._params = config.ajaxParams;
    };

    AjaxChart.prototype = {
        refresh: function(){

        }
    };

`refresh`负责获取用户传入的参数，并请求Ajax，返回时再构造出Highcharts对象。这里我们需要写两个帮助方法。


1.获取用户参数

既然我们前面说“params既可以是个值，也可以是个function”，因此要写一个转化的过程，如果是function，则对function求值。

    AjaxChart.prototype._getAjaxParams = function(){
        var result = {};
        for(key in this._params){
            result[key] = (typeof this._params[key] == 'function') ? (this._params[key])() : this._params[key];
        }
        return result;
    };


2.构造图表

这里根据前面的全局配置来构造Highcharts对象，参数`result`是服务端返回的数据（即Highcharts配置里的`series`）。

    AjaxChart.prototype._updateChart = function(result){
        if('series' in result == false){
            return false;
        }
        
        // 选择图类型
        var chartOptions = $.extend({}, CHART_OPTIONS['global'], CHART_OPTIONS[this._chartType]);
        
        // 选择容器（这里要原生DOM对象）
        chartOptions.chart.renderTo = $(this._container)[0];

        // 载入数据项
        chartOptions.series = result['series']; 

        // 如果是多个series的，显示legend（图示）
        chartOptions.legend.enabled = chartOptions.series.length > 1 ? true : false;

        // 处理xAxis categories
        if('categories' in result){
            if(chartOptions.xAxis instanceof Array){
                for (var i = chartOptions.xAxis.length - 1; i >= 0; i--) {
                    chartOptions.xAxis[i].categories = result['categories'];
                };
            }
            else{
                chartOptions.xAxis.categories = result['categories'];
            }
        }

        // 生成Highcharts对象
        var chart = new Highcharts.Chart(chartOptions);
    };


3.有了上面两个方法，`refresh`就好办了。

    AjaxChart.prototype.refresh = function(){
        var params = this._getAjaxParams();
        var that = this;

        $.post(
            this._url,
            params,
            function(json){
                var result = $.parseJSON(json);
                that._updateChart(result);
            }
        );
    };

注意这里有句`var that = this;`，熟悉回调的朋友肯定对此不陌生，这是为了保存当前的context，因为在Ajax的回调函数执行时，this会指向`xmlhttpresponse`，而不是当前的`AjaxChart`对象。



###扩展1：支持本地数据刷新###

使用场景：当一个表格已经请求好了数据，并放在`table`元素中了。此时图表元素需要做的就是根据表格中的数据生成chart，而并不需要再次向服务器请求数据。

我们为上面的`refresh`方法添加一个参数。

    AjaxChart.prototype.refresh = function(chartData){
        // ajax更新
        if(typeof chartData === 'undefined' && this._url){
            var params = this._getAjaxParams();
            var that = this;

            $.post(
                this._url,
                params,
                function(json){
                    var result;
                    if(typeof json === 'string'){
                        result = $.parseJSON(json);
                    }
                    if(typeof json === 'object'){
                        result = json;
                    }
                    if(typeof result !== 'undefined'){
                        that._updateChart(result);
                    }
                }
            );
        }
        // 非ajax更新
        else{
            this._updateChart(chartData);
        }
    };

这里`chartData`就是Highcharts配置里`series`的格式，这样可以在本地生成符合格式的数据，然后直接`refresh`。`chartData`的格式可以参考[ajaxdata.json](/demo/AjaxChart/v1/ajaxdata.json)或[ajaxdata2.json](/demo/AjaxChart/v1/ajaxdata2.json)。并且这里对ajax返回结果也做了一些判断，以支持JSON字符串或JSON对象。



###扩展2：支持图表点击事件###

使用场景：在柱状图或饼图中，经常需要点击一块时，能够得到相应的联动。比如在图上点击了一块，相应的表格数据过滤了，或是另一个图表也随之更新了等等。

还得为`refresh`方法添加参数，干脆添加一个对象参数。

    AjaxChart.prototype.refresh = function(opts){
        var chartData = opts && opts.chartData;
        var clickHandler = opts && opts.clickHandler;

        // ajax更新
        if(typeof chartData === 'undefined' && this._url){
            var params = this._getAjaxParams();
            var that = this;

            $.post(
                this._url,
                params,
                function(json){
                    var result = $.parseJSON(json);
                    that._updateChart(result, clickHandler);
                }
            );
        }
        // 非ajax更新
        else{
            this._updateChart(chartData, clickHandler);
        }
    };

同时`_updateChart`方法也得再添加一个参数。

    AjaxChart.prototype._updateChart = function(result, handler){
        // 以上省略...

        // 处理events
        if(typeof handler === 'function'){
            chartOptions.plotOptions = $.extend({}, chartOptions.plotOptions, {
                series: {
                    cursor: 'pointer',
                    events: {
                        click: function(evt){
                            var xLabel = evt.point.name || evt.point.category;
                            handler(xLabel, evt.point.y);
                        }
                    }
                }
            });
        }

        // 生成Highcharts对象
        var chart = new Highcharts.Chart(chartOptions);
    };

这里的`handler`中可以获取到两个参数，一个是x坐标的分类值，一个是y坐标的值。应用层里可以这样写。

    chart1.refresh({
        clickHandler: function(xLabel, y){
            alert(xLabel + ': ' + y);
        }
    });



###扩展3：支持自定义回调###

使用场景：跟上面的点击事件差不多，只是这里在图表更新完成后，需要通知某些元素做出相应的处理。

代码也跟上面差不多，再为`refresh`方法添加个参数。

    AjaxChart.prototype.refresh = function(opts){
        var chartData = opts && opts.chartData;
        var clickHandler = opts && opts.clickHandler;
        var afterUpdate = opts && opts.afterUpdate;

        // ajax更新
        if(typeof chartData === 'undefined' && this._url){
            var params = this._getAjaxParams();
            var that = this;

            $.post(
                this._url,
                params,
                function(json){
                    var result = $.parseJSON(json);
                    that._updateChart(result, clickHandler);
                    afterUpdate && afterUpdate();
                }
            );
        }
        // 非ajax更新
        else{
            this._updateChart(chartData, clickHandler);
            afterUpdate && afterUpdate();
        }
    };

如果需要支持更多的自定义事件，最好使用[观察者模式](/blog/2015/01/20/step-by-step-js-component-schoolbox-3#section)，为`AjaxChart.prototype`添加一个`on`和`fire`方法，并在对象中维持一个`handlers`对象。这里就不给出代码了，可参考链接中的内容很容易写出类似的代码。


最后demo

[AjaxChart Demo](/demo/AjaxChart/v1/demo.html)



参考资料
---------
Highcharts官方网站：[www.highcharts.com](http://www.highcharts.com/) 中文网：[www.hcharts.cn](http://www.hcharts.cn/)
