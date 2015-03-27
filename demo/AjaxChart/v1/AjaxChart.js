/*==================================
    AjaxChart
    依赖：[jquery.js, highcharts.js]
====================================
用法
var oneAjaxChart = new AjaxChart({
    container: 'elementId',
    chartType: 'yourChartType',             //'line', 'pie', 'column', 'area'
    ajaxUrl: 'yourAjaxUrl',
    ajaxParams: {
        param1: 'value1',
        param2: function(){
            return 'value2';
        }
    }
});

oneAjaxChart.refresh({
    chartData: {series: []},                //optional
    clickHandler: function(xLabel, y){},    //optional
    afterUpdate: function(){}               //optional
});
如果有chartData，则直接使用该数据更新chart，不进行ajax

NOTE: ajax服务端返回数据格式 {series: [{name: "seriesName", data: [["label", value], ...]}, ...]}

=====================================*/

(function($, Highcharts){
    // ================================
    // Highchart Options 全局设置
    // ================================
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



    // ================================
    // AjaxChart
    // ================================
    var AjaxChart = function(config){
        this._container = config.container;
        this._chartType = config.chartType;
        this._url = config.ajaxUrl;
        this._params = config.ajaxParams;
    };

    AjaxChart.prototype = {
        _getAjaxParams: function(){
            var result = {};
            for(key in this._params){
                result[key] = (typeof this._params[key] == 'function') ? (this._params[key])() : this._params[key];
            }
            return result;
        },

        _updateChart: function(result, handler){
            if('series' in result == false){
                return false;
            }
            
            // 选择图类型
            var chartOptions = $.extend({}, CHART_OPTIONS['global'], CHART_OPTIONS[this._chartType]);
            
            // 选择容器（这里要原生DOM对象）
            chartOptions.chart.renderTo = $(this._container)[0];

            // 载入数据项
            chartOptions.series = result['series']; 

            // 如果是多个series的，显示legend(图示)
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
        },

        refresh: function(opts){
            var chartData = opts && opts.chartData;
            var clickHandler = opts && opts.clickHandler;
            var afterUpdate = opts && opts.afterUpdate;

            // ajax更新
            if(typeof chartData === 'undefined' && this._url){
                var params = this._getAjaxParams();
                // 保存context（ajax返回后this会指向xmlhttpresponse）
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
                            that._updateChart(result, clickHandler);
                            afterUpdate && afterUpdate();
                        }
                    }
                );
            }
            // 非ajax更新
            else{
                this._updateChart(chartData, clickHandler);
                afterUpdate && afterUpdate();
            }
        }
    };


    // ================================
    // export
    // ================================
    window.AjaxChart = AjaxChart;

})(jQuery, Highcharts);