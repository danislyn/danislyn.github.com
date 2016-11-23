---
layout: post
title: "由弹出层引发对滚动原理的讨论"
category: mobile
tags: [mobile, javascript, css]
---
{% include JB/setup %}

上一篇为了解释移动端web的事件和点击穿透问题，我做了一个弹出框做例子，[见demo](/demo/touch-event/problem.html)。现在请把关注点转移到弹出层本身上来，我使用fix定位将它定在屏幕中间，滚动屏幕时发现问题没有，底层元素还是在滚动，只是弹出层在屏幕正中间而且周围有遮罩。所以我们就“滚动”这件事详细说说，可能存在哪些滚动需求。

<!-- break -->

页面滚动原理
------------
在PC上网页滚动主要靠鼠标滚轮，其次按“上”“下”键也能滚动页面，还可以按“空格”“Page Down/Up”以及“HOME”键，或者直接点击或拖动滚动条也能滚动页面。那么我们来做个实验，看这些事件的发生顺序是怎样的。

	document.addEventListener('scroll', function(){
		alert('document scroll');
	});

	window.addEventListener('scroll', function(){
		alert('window scroll');
	});

	window.addEventListener('mousewheel', function(){
		alert('window mousewheel');
	});

	window.addEventListener('keydown', function(e){
		if(37 <= e.keyCode && e.keyCode <= 40 || e.keyCode == 32){
			alert('keydown ' + e.keyCode);
		}
	});

可以得知，当通过鼠标滚轮时，`mousewheel`事件会先触发，然后才是`scroll`。而事件的listener默认是遵循冒泡的，所以绑在`document`上的函数会先触发，然后才是`window`上的。同理，当通过按特定的键去滚动页面时，`keydown`事件会先触发，然后也是`scroll`。

PC上没啥问题，那来看看手机端的表现。

	document.addEventListener('scroll', function(){
		alert('document scroll');
	});

	document.addEventListener('touchstart', function(){
		alert('document touchstart');
	});

	document.addEventListener('touchmove', function(){
		alert('document touchmove');
	});

	document.addEventListener('touchend', function(){
		alert('document touchend');
	});

按照PC上类似的逻辑，以及[前一篇文章中提到的touch事件原理](/blog/2015/10/04/touch-event-and-defect)，我们很容易猜出alert顺序是：touchstart -> touchmove -> scroll -> touchend *但这是事件发生的顺序，并不是alert结果的顺序*。可以扫二维码看看，这个alert很诡异的。

<img src="/assets/captures/20151010_01.png" style="max-width: 172px;">

当慢慢滑时，只会 alert touchstart，然后就没有了。而快速滑时，alert touchstart 然后 alert scroll。这是因为alert框会阻塞事件响应，当touchstart后还没来的及滑动就已经弹出alert了，整个事件线程就被中断了，所以就不会响应scroll了。而当弹出alert后继续滑动（从开始到现在手指始终不松开），然后再松开手指，我们会发现 alert touchstart 后又 alert scroll。为什么alert又没中断事件线程呢？

我们知道PC上的alert框是会中断整个页面的，即除非你先点“确定”，否则页面上的任何操作都是无效的，即整个用户界面被“卡住”了。而在手机上，由于触摸事件的连贯性，*我猜测是这样的*。当手机上弹出alert时是阻塞其他事件的，但由于手指始终没松开，所以整个触摸过程还在继续。一边是alert的阻塞性，一边是前一轮的触摸过程还未结束，由于js单线程的特性，所有事件在用户界面上的响应都是要进入队列处理的，然后才会在界面上体现出来。因为触摸过程是先发生的，它仍未结束，而alert是后发生的，所以alert并不能阻塞当前还未结束的触摸过程。因此只要不松开手指，继续滑动，最后再松开手指，alert touchstart 后还会 alert scroll。

那么还有个问题，为什么不会 alert touchmove 和 alert touchend 呢？我们继续做实验，依次把 touchstart 和 touchmove 的 alert 语句注释掉，看看表现结果。

	document.addEventListener('touchstart', function(){
		// alert('document touchstart');
	});

	document.addEventListener('touchmove', function(){
		alert('document touchmove');
	});

	document.addEventListener('touchend', function(){
		alert('document touchend');
	});

去掉 alert touchstart 后发现只弹出 alert touchmove，我猜测是因为 touchstart / touchmove / touchend 都是在同一轮触摸过程中的，由于alert的阻塞性，前面解释了它允许先发生的触摸（还未松开的手指）继续touch，但是 alert 会阻塞同一轮触摸过程的其他事件的响应函数。而之所以alert弹出后继续滑动手指（始终不松开），仍能看到页面在滚动，这是因为这是浏览器的默认行为，并且touch过程的发生时刻早于alert，所以在队列中alert没法阻塞它。

*以上只是我的猜测，有谁知道具体细节的请告诉我~* 手指不松开时，这个alert框的底层滚动问题正好也迎合了本文一开始说的[弹出框demo](/demo/touch-event/problem.html)，如果有需求说弹出框出现时必须让外部不能滚动，该怎么办？



滚动禁用
---------

### overflow ###

我们经常会写`overflow: hidden`这样的css去让固定尺寸的元素写死，这样就算它的子元素超出了父容器的尺寸范围，也不会“溢出来”。借这个道理，我们可以在root元素上写死，这样`body`里面就不会溢出屏幕了，就不会出现滚动条了。

	html, body{
		overflow: hidden;
	}

但随之又出现了另一个问题，如果页面原来是有滚动条的，在windows下的浏览器中滚动条是会占据一定宽度的（chrome下是17px，firefox下可能是13px），会让整个viewport的宽度减小一段，看起就像页面里的所有元素整体往左偏移一小段。而mac下浏览器的滚动条是悬浮在上面的，所以不会占据页面上的空间。

这样的话，windows就哭了。假设页面原本就是有滚动条的，当我们打开弹出框时，为了禁止滚动，root元素被加上`overflow: hidden`，滚动条消失，底层所有元素就向右偏移一小段。关闭弹出框时，要让页面恢复滚动，root元素改成`overflow: auto`，滚动条又出现了，底层所有元素又向左偏移一小段。整个体验很糟糕！

办法就是在`overflow: hidden`的同时通过`padding-right`把滚动条的空间预留出来。那么如何知道不同浏览器中滚动条到底占多宽呢？通常类似判断当前浏览器是否支持某个css属性或者某些取值，这种跟浏览器环境相关的问题，办法就是试探。用js动态生成一个元素，把你想测试的属性或值赋在这个元素上，然后把元素append到document中去，最后再通过js去取相应的值，看它到底表现出来是啥。

[参考这篇文章](http://segmentfault.com/blog/kidsamong/1190000002545307?utm_source=Weibo&utm_medium=shareLink&utm_campaign=socialShare)，可以知道

> 滚动条宽度 = 元素的offsetWidth - 元素border占据的2倍宽 - 元素的clientWidth

上面公式的前提是，元素具备y轴滚动条。还有种类似办法是

> 滚动条宽度 = 不带滚动条的元素的clientWidth - 为该元素加上y轴滚动条后的clientWidth

	var getScrollbarWidth = function(){
		if(typeof getScrollbarWidth.value === 'undefined'){
			var $test = $('<div></div>');
			$test.css({
				width: '100px',
				height: '1px',
				'overflow-y': 'scroll'
			});

			$('body').append($test);
			getScrollbarWidth.value = $test[0].offsetWidth - $test[0].clientWidth;
			$test.remove();
		}
		return getScrollbarWidth.value;
	};

这是根据第一种计算方式写出的方法，有了这个再配合overflow就能实现页面滚动的禁用与恢复了。[详细代码见demo](/demo/popup-scroll/disable1.html)

	var disableScroll = function(){
		// body上禁用
		$('body, html').css({
			'overflow': 'hidden',
			'padding-right': getScrollbarWidth() + 'px'
		});
	};

	var enableScroll = function(){
		$('body, html').css({
			'overflow': 'auto',
			'padding-right': '0'
		});
	};

我们看看表现结果：PC上很OK，简单有效；手机上完全没卵用！（我是安卓机，注意是真机上无效，而非chrome手机模拟器）

<img src="/assets/captures/20151010_02.png" style="max-width: 170px;">


### 禁用事件 ###

根据上面页面滚动原理我们做的实验，很明显可以把滚动涉及到的事件干掉，这样当然不会滚动了。

	// 记录原来的事件函数，以便恢复
    var oldonwheel, oldonmousewheel, oldonkeydown, oldontouchmove;
    var isDisabled;

	var disableScroll = function(){
        oldonwheel = window.onwheel;
        window.onwheel = preventDefault;

        oldonmousewheel = window.onmousewheel;
        window.onmousewheel = preventDefault;

        oldonkeydown = document.onkeydown;
        document.onkeydown = preventDefaultForScrollKeys;

        oldontouchmove = window.ontouchmove;
        window.ontouchmove = preventDefault;

        isDisabled = true;
	};

	var enableScroll = function(){
		if(!isDisabled){
			return;
		}

        window.onwheel = oldonwheel;
        window.onmousewheel = oldonmousewheel;
        document.onkeydown = oldonkeydown;

        window.ontouchmove = oldontouchmove;
        isDisabled = false;
	};

这里要注意的是，不同浏览器上事件到底在`window`还是`document`上，PC上会有一些浏览器兼容处理。[详细代码见demo](/demo/popup-scroll/disable2.html)

同样看看表现结果：PC上很粗暴的解决了；手机上也OK

<img src="/assets/captures/20151010_03.png" style="max-width: 171px;">



弹出层滚动需求
-------------
至此我们看到，使用`overflow`能够解决PC上的滚动禁用问题，而禁用与滚动相关的事件能够彻底解决PC和手机的问题。那么有弹出层的话，就应该禁用整个页面的滚动吗，如果弹出层内部需要滚动怎么办？即我们有可能面临这样的需求：弹出框的内部是可以滚动的，而弹出层外部和底层元素是不能滚动的。

### 先看overflow ###

前面说到给root元素写上`overflow: hidden`就可以禁用滚动，那么我们对弹出层这个容器重新写个`overflow: scroll`就可以了。

	#popupLayer{
		overflow: scroll;
	}

PC上简单有效，但是同样手机上不鸟这些。[见demo](/demo/popup-scroll/inner1.html)


### 事件禁用与恢复 ###

我们把document上的`mousewheel`事件禁用了，即给它绑上了一个事件函数，只不过事件函数里将事件发生后的浏览器默认行为阻止了。

	function preventDefault(e) {
	    e = e || window.event;
	    e.preventDefault && e.preventDefault();
	    e.returnValue = false;
	}

	var disableScroll = function(){
		$(document).on('mousewheel', preventDefault);
		$(document).on('touchmove', preventDefault);
	};

于是思路就来了，我们知道浏览器里的事件是遵循冒泡机制的（准确来说是先从root节点由外向内“捕获”，然后到达目标元素后，事件再由内向外逐层冒泡，[关于这个机制请看这篇文章的第一部分](http://www.cnblogs.com/yexiaochai/p/3451045.html)，这不是本文的重点）。所以我们就可以为弹出层的元素再绑个同样的事件，阻止事件冒泡到document上，这样就不会调用到`e.preventDefault()`就不会阻止浏览器默认的滚动行为了。

	function preventDefault(e) {
	    e = e || window.event;
	    e.preventDefault && e.preventDefault();
	    e.returnValue = false;
	}

	// 内部可滚
	$('#popupLayer').on('mousewheel', stopPropagation);
	$('#popupLayer').on('touchmove', stopPropagation);

[来看下demo](/demo/popup-scroll/inner2.html)，手机上请看

<img src="/assets/captures/20151010_04.png" style="max-width: 172px;">

背景层是不能滚动的，而弹出层妥妥的可以滚动了！但是发现问题了不，弹出层内部滚动到底部再继续滚时，会将背景底层的元素一起滚下去了，这尼玛FUCK



改进的内部滚动
-------------
解决问题的思路很清晰，就是判断滚动边界，当滚动到达bottom和top时，就阻止滚动就好啦。

	function innerScroll(e){
    	// 阻止冒泡到document
    	// document上已经preventDefault
    	stopPropagation(e);

		var delta = e.wheelDelta || e.detail || 0;
		var box = $(this).get(0);

		if($(box).height() + box.scrollTop >= box.scrollHeight){
			if(delta < 0) {
				preventDefault(e);
				return false;
			}
		}
		if(box.scrollTop === 0){
			if(delta > 0) {
				preventDefault(e);
				return false;
			}
		}
		// 会阻止原生滚动
		// return false;
    }

    $('#popupLayer').on('mousewheel', innerScroll);

代码很简单，关于`scrollTop` `scrollHeight`等解释[请看这篇文章](http://segmentfault.com/blog/kidsamong/1190000002545307?utm_source=Weibo&utm_medium=shareLink&utm_campaign=socialShare)。这里唯一要注意的是对鼠标滚动值`wheelDelta`的获取可能要做兼容性处理，实在有问题的话可以使用[jquery-mousewheel](https://github.com/jquery/jquery-mousewheel)去获取鼠标的滚动量。

上面这段代码是PC上的判断滚动边界的处理，那手机上又该怎么做的，手机上没有鼠标，如何获取到滚动量delta？


### IScroll的启发 ###

我想起“局部滚动”界的大佬——IScroll，[可以去看下源码](https://github.com/cubiq/iscroll/blob/master/src/core.js)，细节很复杂但是大体结构是很清晰的。

	_start: function (e) {
		
		this.startX    = this.x;
		this.startY    = this.y;
		this.absStartX = this.x;
		this.absStartY = this.y;
		this.pointX    = point.pageX;
		this.pointY    = point.pageY;

		this._execEvent('beforeScrollStart');
	},

	_move: function (e) {
		
		var point		= e.touches ? e.touches[0] : e,
			deltaX		= point.pageX - this.pointX,
			deltaY		= point.pageY - this.pointY;

		this.pointX		= point.pageX;
		this.pointY		= point.pageY;

	},

这是iscroll中的一小段代码，这就是获取touchmove滚动量的办法。于是我们就能写出类似上面`innerScroll`适用于手机上的判断滚动边界的办法了。

	// 移动端touch重写
	var startX, startY;

	$('#popupLayer').on('touchstart', function(e){
		startX = e.changedTouches[0].pageX;
		startY = e.changedTouches[0].pageY;
	});

	// 仿innerScroll方法
	$('#popupLayer').on('touchmove', function(e){
		e.stopPropagation();

		var deltaX = e.changedTouches[0].pageX - startX;
		var deltaY = e.changedTouches[0].pageY - startY;

		// 只能纵向滚
		if(Math.abs(deltaY) < Math.abs(deltaX)){
			e.preventDefault();
			return false;
		}

		var box = $(this).get(0);

		if($(box).height() + box.scrollTop >= box.scrollHeight){
			if(deltaY < 0) {
				e.preventDefault();
				return false;
			}
		}
		if(box.scrollTop === 0){
			if(deltaY > 0) {
				e.preventDefault();
				return false;
			}
		}
		// 会阻止原生滚动
		// return false;
	});

这里要注意的是，我加了一条判断，弹出层内部的滚动只能纵向滚，即 deltaY 要大于 deltaX。因为我发现个bug，当没有这条判断时，弹出层内部可以横向滚，滚出的都是空白，大家可以自己试下。还有这里到底使用`e.changedTouches[0]`还是像iscroll里的`e.touches[0]`获取当前滚动的手指，其实都OK，[可以看下这篇文章](http://www.cnblogs.com/aaronjs/p/4778020.html)

[最后请看demo](/demo/popup-scroll/inner2up.html)，~~手机请扫二维码，效果棒棒的！~~

<img src="/assets/captures/20151010_05.png" style="max-width: 171px;">

注：一年前做这个demo时，我手机 ( Meizu Android 4.4.2 ) 上效果是OK的，在 [SegmentFault](https://segmentfault.com/) 论坛上不止一个人回复说上面的方案有问题，有一半机率是不行的，快速滑的时候肯定不行。


### 来自SF网友的方案 ###

网友 [jiehwa](https://segmentfault.com/u/jiehwa520) 的提到不需要重写事件那么麻烦，通过几个 css属性 控制即可。

- 弹出层父元素设置属性 `overflow-y: scroll`
- 弹窗弹出时，用js控制底层元素的 position 属性置为 `fixed`
- 弹窗关闭时，用js控制底层元素的 position 属性置为 `static`
- 在 iOS 端，为了弹窗里面的滚动效果看起来顺滑，需要设置弹窗层的包裹元素属性：`-webkit-overflow-scrolling: touch`

[css方案的demo](/demo/popup-scroll/inner3.html)（感谢 SegmentFault 网友）

<img src="/assets/captures/20151010_06.png" style="max-width: 170px;">

可以看到有瑕疵，当强行将底层元素置为 `fixed` 后，由于 fixed 定位会让元素脱离正常的DOM文档流，所以原本位于页面底部的元素就一下子顶上来了。还有当底层元素滑动一段距离后再打开弹出层，底层元素又被 fixed 定位重置了，看着也很别扭。

仔细阅读后发现我误解了，控制底层元素的 fixed 定位应该作用在 `<body>` 的一级子元素，而弹出层的包裹元素也是 `<body>` 的一级子元素，于是 [改进后的 demo](/demo/popup-scroll/inner3up.html) 如下

<img src="/assets/captures/20151010_07.png" style="max-width: 170px;">

现在“页面底部”这几个字不会顶上来了，但是滑动一段距离后再打开弹出层时的页面底层还是会抖动，这个暂时也想不出很好的解决方案

<img src="/assets/photos/wulian.jpg" style="width: 56px;">



最后感谢[叶小钗](http://www.cnblogs.com/yexiaochai/)，最近一直在看他关于移动端事件原理的博客，有点学会了他那种 代码实验 -> 猜测解释 -> 验证原理 -> 改进问题 这样的学习方法。本文也花了很大力气写代码实验，疏漏之处望多多指正，谢谢耐心的看完



参考资料
---------
[知乎上的一个讨论](http://www.zhihu.com/question/21865401)
