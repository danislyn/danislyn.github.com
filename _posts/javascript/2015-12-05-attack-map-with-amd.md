---
layout: post
title: "前端模块化开发demo之攻击地图"
category: javascript
tags: [javascript, AMD]
---
{% include JB/setup %}

很早以前写过一篇[用RequireJS包装AjaxChart](/blog/2015/02/07/wrap-ajaxchart-with-requirejs)，当时用Highcharts做图表，在其上封装了一层ajax，最后只是简单套用了一下requireJS。由于当时自己才接触模块化，理解层面还太浅，后来经过其他项目的磨练以及实习获得的见识，想重新结合一个示例来写点前端模块化的开发方式。

<!-- break -->

项目背景
--------
最近在做一个安全运维监控的项目，其中有一条是根据设备获取到的攻击数据，在地图上做可视化。对比了[Highcharts](http://www.hcharts.cn/)和[ECharts](http://echarts.baidu.com)

- ECharts对国内地图的支持更多
- ECharts在模块化和扩展方面做的比Highcharts更好

所以最后我选择了基于ECharts去封装。类似的网络攻击的监控地图可看国外的[Norse Attack Map](http://map.norsecorp.com)，也算是同类的参照。


需求整理
--------
数据要求

- 提供的数据只有IP到IP的攻击，包括攻击时间、攻击类型等，需要自行根据IP定位到相应的经纬度。

展现要求

- 地图提供世界、中国、省份，这三种维度（只针对中国）
- 要在地图上表现出攻击的来源与目标之间的动画
- 需要强调出攻击受灾地区，可一眼看出哪里是重灾区
- 可以循环表现攻击，也可实时刷新攻击数据


目录结构
--------

	- index.html 主页面
	- assets
		- css
			- normalize.css 浏览器初始化样式
			- common.css 从bootstrap里扒了一些基础样式
		- img/ 
	- js
		- app
			- mainMap.js index页面的主执行js
		- lib
			- echarts/ 用了源码包
			- zrender/ 同样源码包，具体看echarts官方说明
			- geo 一些地理数据的定义
				- china/
				- world/
			- mods
				- attackMap/ 对echarts map的封装
				- util.js 等等其他帮助或插件模块的封装
				- xxxx.js
		- config.js

### requireJS的config配置

	requirejs.config({
	    baseUrl: 'js/lib',
	    paths: {
	    	jquery: 'http://cdn.staticfile.org/jquery/1.7.2/jquery.min',
	        underscore: 'http://cdn.staticfile.org/underscore.js/1.7.0/underscore-min'
	    },
	    packages: [
	        {
	            name: 'echarts',
	            location: 'echarts/src',
	            main: 'echarts'
	        },
	        {
	            name: 'zrender',
	            location: 'zrender/src',
	            main: 'zrender'
	        }
	    ]
	});


map封装过程
-----------
初步封装 mods/attackMap/main.js

	define(function(require){

	    var U = require('underscore');
	    var EC = require('echarts/echarts');
	    var ecMap = require('echarts/chart/map');
	    var ecMapParams = require('echarts/util/mapData/params').params;

	    var EVENT = require('echarts/config').EVENT;
	    var MAP_TYPE_WORLD = 'world';
	    var MAP_TYPE_CHINA = 'china';


	    var AttackMap = function(config){
	        this.config = U.extend({
	            view: MAP_TYPE_WORLD
	        }, config);

	        this.el = document.getElementById(this.config.id);
	        // 初始化echarts
	        this._init();
	    };

	    // 不带下划线的为对外暴露的方法
	    AttackMap.prototype = {
	        _init: function(){
	            // _chart对象私有
	            this._chart = EC.init(this.el);
	            // default view
	            var mapOption = U.extend({}, require('mods/attackMap/mapOption'));
	            // 合并option
	            U.extend(mapOption.series[0], this._getViewOption(this.config.view));
	            // render
	            this._chart.setOption(mapOption);

	            // 交互
	            this._bindEvents();
	        },

	        _bindEvents: function(){
	            var that = this;
	            this._chart.on(EVENT.CLICK, function(e, chart){
	                // 仅对中国钻取
	                if(e.data.name === '中国' || e.data.name === 'China'){
	                    that.setView(MAP_TYPE_CHINA);
	                }
	                // and中国省份钻取
	                else if(e.data.name in ecMapParams){
	                    that.setView(e.data.name);
	                }
	            });
	        },

	        // view涉及到的series里需要设置的属性
	        _getViewOption: function(viewType){
	            if(viewType === MAP_TYPE_WORLD){
	                return {
	                    mapType: MAP_TYPE_WORLD,
	                    nameMap: require('geo/world/countryName')
	                }
	            }
	            else if(viewType === MAP_TYPE_CHINA){
	                return {
	                    mapType: MAP_TYPE_CHINA
	                };
	            }
	            else if(viewType in ecMapParams){
	                return {
	                    mapType: viewType
	                };
	            }
	            return {};
	        },

	        _setOtherOption: function(viewType){
	            if(viewType === MAP_TYPE_WORLD){
	                this._chart.chart.map.series[0].itemStyle.normal.label.show = false;
	                this._chart.chart.map.series[0].markLine.effect.period = 15;
	            }
	            else if(viewType === MAP_TYPE_CHINA){
	                this._chart.chart.map.series[0].itemStyle.normal.label.show = false;
	                this._chart.chart.map.series[0].markLine.effect.period = 8;
	            }
	            else{
	                this._chart.chart.map.series[0].itemStyle.normal.label.show = true;
	                this._chart.chart.map.series[0].markLine.effect.period = 4;
	            }
	        },

	        // 设置地图视图
	        setView: function(viewType){
	            // 上一次的view
	            (typeof this._lastView === 'undefined') && (this._lastView = this.config.view);
	            // 防止重复set
	            if(viewType === this._lastView){
	                return false;
	            }
	            this._lastView = viewType;

	            // 历史开过的view（string逗号分隔）
	            (typeof this._historyViews === 'undefined') && (this._historyViews = this.config.view);
	            // 用来判断是否加载过
	            if(this._historyViews.indexOf(viewType) === -1){
	                this._historyViews += (',' + viewType);
	                // loading
	                this._chart.showLoading();
	                // 假loading
	                var that = this;
	                setTimeout(function(){
	                    that._chart.hideLoading();
	                }, 350);
	            }

	            // 要先reset再draw
	            this.reset();
	            var viewOption = this._getViewOption(viewType);
	            this._chart.setSeries([viewOption]);
	            // 多级的option没法merge原来的，所以得手动设置
	            this._setOtherOption(viewType);
	        },

	        // 攻击线
	        setAttacks: function(data, isLoop){
	            // 是否循环显示markline（暂未用到）
	            isLoop = isLoop || true;
	            // 留个data备份（暂未用到）
	            this._mData = data;

	            // TODO: 要对IP聚合
	            // 国内最小定位到市级，国外只能定位到国家
	            // 而markline只能通过 name-name 来标识
	            // 聚合后相同 name-name 的攻击累计次数视为强度

	            var lineData = U.map(data, function(v){
	                return [
	                    {name: v['srcName'], geoCoord: [v['srcLocX'], v['srcLocY']]},
	                    {name: v['destName'], geoCoord: [v['destLocX'], v['destLocY']]}
	                ]
	            });

	            var pointData = U.map(data, function(v){
	                return {
	                    name: v['destName'],
	                    geoCoord: [v['destLocX'], v['destLocY']]
	                }
	            });

	            // ECharts内部的核心变量
	            var _map = this._chart.chart.map;
	            // 防止addMarkLine抛异常 seriesIndex 0
	            // _map.buildMark(0);

	            try{
	                this._chart.addMarkLine(0, {data: lineData});
	            }catch(e){
	                // console.error(e);
	            }
	            
	            try{
	                this._chart.addMarkPoint(0, {data: pointData});
	            }catch(e){
	                // console.error(e);
	            }
	        },
	        
	        // 通用方法
	        refresh: function(){
	            this._chart.refresh();
	        },
	        reset: function(){
	            this._chart.restore();
	        }
	    };

	    return AttackMap;
	});

这里我用echarts中的MarkLine作为攻击线，MarkPoint作为受害地点，AttackMap封装了对echarts的操作过程，对外只暴露`setView`和`setAttacks`两个方法，以实现地图维度的缩放以及攻击线的表现。其中echarts map的通用配置项都拎到了`mods/attactMap/mapOption.js`中，这里AttackMap只手工操作部分option，比如根据地图的维度修改MarkLine动画的速率。

应用层 js/app/mainMap.js

	require([
	    'jquery',
	    'mods/attackMap/main',
	    'mods/attackMap/mock'

	], function($, AttackMap, Mock){

	    var View = {
	        // 作为一个视图模版来初始化
	        init: function(){
	            // 此View片段的root元素
	            // this.$el = $('body');

	            // 初始化成员
	            this.aMap = new AttackMap({
	                id: 'mapChart',
	                view: 'world'
	            });

	            // 绑定事件
	            this._bindEvents();
	        },

	        _bindEvents: function(){
	            var that = this;
	            // 视图切换
	            this._bindMapViewEvents();

	            // 其他binding
	            $(window).on('resize', function(){
	                that.aMap.resize();
	            });
	        },

	        // 视图切换事件
	        _bindMapViewEvents: function(){
	            var that = this;

	            // NOTE: 会有动态生成的元素
	            $('.J_changeView').live('click', function(){
	                that.aMap.setView($(this).attr('data-type'));
	            });
	        },

	        // 攻击数据展现
	        _renderAttacks: function(data){
	            // render map
	            this.aMap.setAttacks(data);

	            // render table
	            var $tbody = $('#attacksTable').find('tbody');
	            // var $frags = [];
	            $.each(data, function(i, v){
	                var $tr = $('<tr><td>'+v['srcIp']+'</td><td>'+v['srcName']+'</td><td>'+v['destIp']+'</td><td>'+v['destName']+'</td><td>'+v['type']+'</td><td>'+v['time']+'</td></tr>');
	                $tbody.append($tr);
	            });
	        },

	        // 获取攻击数据
	        getAttacks: function(){
	            var that = this;
	            // ajax TODO

	            // 本地mock数据
	            that.attacksData = Mock.data;
	            that._renderAttacks(that.attacksData);
	        }
	    };

	    // execution
	    View.init();

	    // lazy load
	    setTimeout(function(){
	        View.getAttacks();
	    }, 16);

	});

至此，在应用层页面上，可以通过点击`.J_changeView`按钮来切换地图的维度(世界/中国/省份)，攻击数据的展现暂时没有ajax调用，只是简单用了mock数据来做，大体效果是一样的。

[最终demo](/demo/AttackMap/index.html)


自定义事件封装
-------------
在上面的demo链接中看到，不仅应用层页面的按钮可以切换地图维度，直接点击地图里的"中国"区域也能切换地图，同时又能通知到应用层页面的按钮改变状态。因此应用层页面是需要关心AttackMap的状态(事件)的，同样将鼠标放在攻击线上出现的攻击详情，也是通过监听AttackMap的事件实现的。

1、在 mods/attackMap/main.js 中定义事件类型

	// 对外事件
    AttackMap.EVENTS = {
        VIEW_CHANGED: 'viewChanged',
        LINE_HOVERED: 'marklineHovered',
        LINE_BLURED: 'marklineBlured'
    };

2、在AttackMap中实现事件触发器

	AttackMap.prototype = {
		on: function(type, fn){
            (typeof this._handlers === 'undefined') && (this._handlers = {});
            (typeof this._handlers[type] === 'undefined') && (this._handlers[type] = []);
            this._handlers[type].push(fn);
        },
        fire: function(type, data, event){
            if(typeof this._handlers === 'undefined' || 
                typeof this._handlers[type] === 'undefined'){
                return false;
            }

            var that = this;
            var eventObj = {
                type: type,
                data: data
            };
            // 原生event对象
            (typeof event !== 'undefined') && (eventObj.event = event);
            
            U.each(this._handlers[type], function(fn){
                fn(eventObj, that);
            });
        }
    };

3、在AttackMap内部适当的方法中`fire`自定义事件

	AttackMap.prototype = {
		_bindEvents: function(){
			var that = this;
			// 省略...

            this._chart.on(EVENT.HOVER, function(e, chart){
                // 是markline
                if(e.name.indexOf('>') !== -1){
                    // 阻止此时的tooltip
                    that._chart.chart.map.component.tooltip.hideTip();

                    // 由外部去渲染
                    that.fire(
                        AttackMap.EVENTS.LINE_HOVERED,
                        { name: e.name },
                        e.event
                    );
                }
                // 不是markline，告诉外部
                else{
                    // 效率有点低 每次hover都会触发
                    that.fire(AttackMap.EVENTS.LINE_BLURED);
                }
            });
        },
		setView: function(viewType){
            // 省略...

            // 对外fire事件
            this.fire(
                AttackMap.EVENTS.VIEW_CHANGED, 
                { viewType: viewType }
            );
        }
    };

当触发`AttackMap.EVENTS.LINE_HOVERED`事件时，由于应用层页面要绘制攻击详情的浮层，需要知道鼠标位置信息，所以这里`fire`时将原生的event对象也传了进去。（注意`fire`方法的实现中，传给回调函数的`eventObj`对象中，有事件类型type，自定义data，以及原生event对象）

4、在应用层js中监听自定义事件

	// 别名
    var MAP_EVENTS = AttackMap.EVENTS;

    var View = {
		// 视图切换事件
        _bindMapViewEvents: function(){
            var that = this;

            // AttackMap监听
            this.aMap.on(MAP_EVENTS.VIEW_CHANGED, function(e){
                var type = e.data.viewType;
                // 清空当前
                $current = $('.view-nav.active');
                $current.removeClass('active');

                // 目标
                var $target = $('.view-nav[data-type="' + type + '"]');
                if($target.length == 0){
                    // 另起一个
                    var $copy = $current.clone();
                    $copy.addClass('active').attr('data-type', type).text(type);
                    $('#dynamicNav').empty().append($copy);
                }
                else{
                    $target.addClass('active');
                }
            });

            // 省略...
        },

        // 攻击线(地图markline)事件
        _bindMapLineEvents: function(){
            var that = this;

            this.aMap.on(MAP_EVENTS.LINE_HOVERED, function(e){
                // 前提：srcName-destName 必须能唯一区分
                // 国外IP目前只能定位到国家
                var temps = (e.data.name).split(' > ');
                var source = temps[0];
                var dest = temps[1];

                var attacks = that.attacksData;
                // 遍历data
                for(var i=0; i<attacks.length; i++){
                    if(attacks[i]['srcName'] === source && attacks[i]['destName'] === dest){
                        that._drawMapLineDetail(attacks[i], e.event.pageX, e.event.pageY);
                        break;
                    }
                }
            });

            this.aMap.on(MAP_EVENTS.LINE_BLURED, function(e){
                that._hideMapLineDetail();
            });
        },

		// 画攻击线详情
        _drawMapLineDetail: function(){
			// 细节省略...
        },
		_hideMapLineDetail: function(){
			// 细节省略...
		}
    };

[再看一遍demo](/demo/AttackMap/index.html)


点缀的动画效果
-------------

### 时钟模块

比较简单，源码在 js/lib/mods/clock.js 中，下面只列出大体结构。

	define(['jquery'], function($){
	    var Clock = function(config){
	        this.$el = $('#' + this.config.id);
	        this._init();
	    };

	    Clock.prototype = {
	        _init: function(){
	            // 细节省略...
	            this.start();
	        },
	        _update: function(){
	            // 细节省略...
	        },
	        start: function(){
	            // 先初始化时间
	            this._update();

	            var that = this;
	            this.timer = setInterval(function(){
	                that._update();
	            }, 1000);
	        },
	        stop: function(){
	            clearInterval(this.timer);
	            this.timer = null;
	        }
	    };

	    return Clock;
	});

### move动画封装

原理是采用的css中`transform`动画，我们原本的做法会是先定义两个css class，一个添加transform的各种css规则，另一个class添加与前一项相反(或清除动画)的css规则，然后通过js操控DOM元素，在两个class之间切换。但我觉得这种做法太挫了，可以把相同效果的transform封装起来（避免写大同小异的css class），于是我封装了一个只做move移动的动画util方法。

	define(['jquery', 'underscore'], function($, U){
	    return {
	        /* 移动动画
	            @param el {HTMLElement}
	            @param x1 {number}
	            @param y1 {number}
	            @param x2 {number}
	            @param y2 {number}
	            @param config {Object}
	                @param duration {number}
	                @param ease {string}
	                @param isShowEl {boolean} 动画结束后是否继续显示元素
	                @param isClear {boolean} 动画结束后是否清除动画属性
	                @param beforeAnim {Function}
	                @param afterAnim {Function}
	        */
	        moveAnim: function(el, x1, y1, x2, y2, config) {
	            if(!el){
	                return;
	            }
	            if(!el.tagName && el.length){
	                // jquery节点
	                el = el[0];
	            }

	            var style = el.style;
	            config = U.extend({
	                duration: 400,
	                ease: 'ease',
	                isShowEl: true,
	                isClear: false
	            }, config);

	            style.display = 'block';
	            style.transform = 'translate3d(' + x1 + 'px, ' + y1 + 'px, 0px)';
	            style.transitionDuration = '0ms';
	            style.webkitTransform = 'translate3d(' + x1 + 'px, ' + y1 + 'px, 0px)';
	            style.webkitTransitionDuration = '0ms';

	            // before animation
	            config.beforeAnim && config.beforeAnim();

	            setTimeout(function() {
	                style.transform = 'translate3d(' + x2 + 'px, ' + y2 + 'px, 0px)';
	                style.transitionDuration = config.duration + 'ms';
	                style.transitionTimingFunction = config.ease;
	                style.webkitTransform = 'translate3d(' + x2 + 'px, ' + y2 + 'px, 0px)';
	                style.webkitTransitionDuration = config.duration + 'ms';
	                style.webkitTransitionTimingFunction = config.ease;

	                // 下面不会有第二次setTimeout
	                if(config.isShowEl && !config.isClear){
	                    // after animation
	                    config.afterAnim && config.afterAnim();
	                }
	            }, 0);

	            // 动画结束后不显示元素
	            if(!config.isShowEl){
	                style.display = 'none';
	            }
	            // 清空动画属性（下次show时显示在最初的位置）
	            if(!config.isShowEl || config.isClear){
	                var that = this;
	                setTimeout(function() {
	                    that._clearTransform(el);
	                    // after animation
	                    config.afterAnim && config.afterAnim();
	                }, config.duration + 10);
	            }
	        },

	        _clearTransform: function(el){
	            var style = el.style;
	            style.transform = null;
	            style.transitionDuration = null;
	            style.transitionTimingFunction = null;
	            style.webkitTransform = null;
	            style.webkitTransitionDuration = null;
	            style.webkitTransitionTimingFunction = null;
	        }
	    }
	});

### 基于move动画的滚动表格

在demo中可以看到屏幕下方的攻击数据的表格一直在滚动播放，现在已经很少人还在用`<marquee>`这种东西了，好比已经淘汰的用`<table>`做页面布局。我这里基于上面的动画util方法，实现了一个滚动播放的table组件。

实现思路是，先要对table元素做预处理，将thead拷贝一份，因为表格滚动时thead是不动的(相当于sticky)。代码结构类似上面的Clock类，主动画逻辑包在`setInterval`中。每次动画循环到来时，取出tbody的第一个`tr`元素的高度h，然后将table整体向上move这段高度h，move结束后将第一个`tr`追加到tbody的队尾。具体实现代码见 js/lib/mods/animTable.js



还有什么欠缺的
-------------
最初的展现需求都已实现了，在这过程中封装了AttackMap，并自己实现了自定义事件，完全将echarts对外透明了。同时还产出了几个非主要的js小组件，过程看似拉的很长，但都是一步步自然而然会产生的想法。这里还遗留着一个问题，**如何将html模板、样式和js模块捆绑起来**，即只需reuqire一下模块，模块相应的css会一并载入。

	<!-- 不需要 <link rel="stylesheet" href="moduleA.css"> -->
	<div>
		<!-- 引入组件的html模板 -->
		%{ require moduleA }%
	</div>

	<script>
	require(['mods/moduleA'], function(A){
		// something...
	});
	</script>

我想达到的效果就像上面，应用层页面不需要引组件模块的css，只要inclue一份html模板，require一下对应的js模块。有知道具体做法的吗，我想进一步交流。


### demo

- [在线demo](/demo/AttackMap/index.html)

- [demo源码](/demo/AttackMap.zip)

### 感想

- 在繁忙的项目中抽出时间做些整理和总结，是件重要但不紧急的事情。

- 和以前写的文章一对比，明显感觉到自己这半年多的成长。
