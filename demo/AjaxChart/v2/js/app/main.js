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


requirejs(['jquery', 'highcharts', 'AjaxChart'], function($, Highcharts, AjaxChart){
    
    // Chart with ajax
    var chart1 = new AjaxChart({
        container: '#chartDemo1',
        chartType: 'line',
        ajaxUrl: 'ajaxdata.json',
        ajaxParams: {}
    });

    chart1.refresh();


    // Chart with JSONP
    var chart2 = new AjaxChart({
        container: '#chartDemo2',
        chartType: 'line'
    });

    // jquery写法
    $.getJSON('http://115.29.242.187:8080/test/testChartJSONP?callback=?', function(result){
        chart2.refresh({
            chartData: result
        });
    });

    // 原生写法
    /*var script = document.createElement('script');
    script.src = 'http://115.29.242.187:8080/test/testChartJSONP?callback=jsonpHandler';
    document.body.appendChild(script);

    window.jsonpHandler = function(result){
        chart2.refresh({
            chartData: result
        });
    };*/


    // Chart with local data
    var chartDataSeries = {"series":[{"name":"Tokyo","data":[["1月",8],["2月",42],["3月",86],["4月",22],["5月",32],["6月",4],["7月",71],["8月",99],["9月",94],["10月",14],["11月",1],["12月",41]]},{"name":"New York","data":[["1月",80],["2月",90],["3月",67],["4月",0],["5月",22],["6月",17],["7月",64],["8月",7],["9月",23],["10月",13],["11月",25],["12月",91]]}]};

    var chart3 = new AjaxChart({
        container: '#chartDemo3',
        chartType: 'line'
    });

    chart3.refresh({
        chartData: chartDataSeries
    });


    // Chart with events
    var chartDataSingle = {"series":[{"name":"New York","data":[["1月",80],["2月",90],["3月",67],["4月",0],["5月",22],["6月",17],["7月",64],["8月",7],["9月",23],["10月",13],["11月",25],["12月",91]]}]};

    var chart4 = new AjaxChart({
        container: '#chartDemo4',
        chartType: 'column'
    });

    chart4.refresh({
        chartData: chartDataSingle,
        clickHandler: function(xLabel, y){
            alert(xLabel + ': ' + y);
        }
    });


    // Chart with callback
    var chart5 = new AjaxChart({
        container: '#chartDemo5',
        chartType: 'area'
    });

    chart5.refresh({
        chartData: chartDataSingle,
        afterUpdate: function(){
            alert('Chart with callback!');
        }
    });

});