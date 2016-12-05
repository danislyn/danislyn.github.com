---
layout: post
title: "常用模式片段之RAF"
category: javascript
tags: [javascript, 常用片段]
published: true
---
{% include JB/setup %}

RAF(requestAnimationFrame) 在好多地方都有见到过，只知道它和浏览器的动画有点关系，它到底是个什么鬼，有啥作用有啥好处，今天查了一些资料和以往的笔记，做个整理。

<!-- break -->

什么是 RAF
----------
回想第一次见到 *requestAnimationFrame* 应该是当时在公司实习的时候，经常看到它常常和 *setTimeout* 同时出现，比如下面这样的代码片段

```
var raf = window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || function(callback) {
    		// 保证 60fps 帧率的流畅效果，每帧间隔 16.7 ms
            window.setTimeout(callback, 1000 / 60);
        };
```

第一印象：这货和动画有关，and 这货可以用 `setTimeout` 来模拟。

关于它们两者的关系，可以看[张鑫旭的科普文章](http://www.zhangxinxu.com/wordpress/2013/09/css3-animation-requestanimationframe-tween-%E5%8A%A8%E7%94%BB%E7%AE%97%E6%B3%95/)，可以明确两件事：

- 递归调用 setTimeout 来做动画时，如果间隔时间选择不当，或者中途有其他 timer 任务乱入时，会导致动画卡顿
- 而 requestAnimationFrame 会跟着浏览器的绘制走，由浏览器来保证它的执行间隔时间（60fps 的动画相当于 16.7ms 一帧）

#### 官网解释

> The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes as an argument a callback to be invoked before the repaint.

以上是来自 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) 的解释，链接里还包含了 demo 代码，以及它的兼容性情况。

特别需要注意的是：**在页面当前不在活动状态下，`requestAnimationFrame`是不会运行的**，而 `setTimeout` 仍会在后台运行。

我举个不一定恰当的类比：如果 `setTimeout` 是不停重设元素 position 来做的动画，那 `requestAnimationFrame ` 就好比是 CSS3 transition 动画。效果和性能，显然后者胜于前者。


Polyfill
---------
RAF 既然这么好的东西，显然是存在兼容问题的，在上面 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) 链接里可以看到，**IE 10+**，不容乐观啊。。。所以本文最初第一印象的那段代码可以视为一种 Polyfill (可以理解为“备胎”函数)

查了网上的解决方案，包括 淘宝 也使用了这套 Polyfill：

```
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
	    window.requestAnimationFrame = function(callback, element) {
	        var currTime = new Date().getTime();
	        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
	        var id = window.setTimeout(function() {
	            callback(currTime + timeToCall);
	        }, timeToCall);
	        lastTime = currTime + timeToCall;
	        return id;
	    };
    }
    if (!window.cancelAnimationFrame) {
	    window.cancelAnimationFrame = function(id) {
	        clearTimeout(id);
	    };
    }
}());
```

关键是 `timeToCall` 的计算，保证每次调用 `requestAnimationFrame` 都是在浏览器的空闲期（前一帧动画已经执行完）。相比只使用 `setTimeout`，可以减少动画丢帧的情况。


应用场景
--------

### 应用1：确保页面onload

```
onLoad: function(callback){
    var rAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function(fun) {
        setTimeout(fun, 16);
    };
    if(document.readyState === 'complete'){
        rAF(callback);
    }else{
        window.addEventListener('load', function(){
            rAF(callback);
        });
    }
}
```

### 应用2：改进动画性能

```
var requestAnimFrame = window.requestAnimationFrame || (function () {
    var timeLast = 0;
    return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        var timeCurrent = (new Date()).getTime();
        var timeDelta;
        /* Dynamically set the delay on a per-tick basis to more closely match 60fps. */
        /* Technique by Erik Moller. MIT license. */
        timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
        timeLast = timeCurrent + timeDelta;
        return setTimeout(function () {
            callback(timeCurrent + timeDelta);
        }, timeDelta);
    };
})();

// 递归调用 timeout
self.timer = setTimeout(function () {
    // 保证在上一次动画结束后再执行
    // 若页面不在 active 状态下，requestAnimFrame 不会执行
    // 相比 “递归 setTimeout” 动画会一直运行，节省CPU（尤其在移动端）
    requestAnimFrame(function () {
        clearTimeout(self.timer);
        self.next();
    });
}, self.timeout);
```

### 应用3：模块懒加载

```
var __lazyLoaded = false;
function runLazyQueue() {
  if(__lazyLoaded) {
    return;
  }
  __lazyLoaded = true;
  
  $(window).detach("mousemove scroll mousedown touchstart touchmove keydown resize onload", runLazyQueue);
  
  var module;
  while (module = lazyQueue.shift()) {
    ~function(m){
      // 保证在浏览器空闲时间处理 JS 程序, 保证不阻塞
      window.requestAnimationFrame(function() {
        new Loader(m.$mod, m.data, m.force);
      });
    }(module);
  }
}

$(window).on("mousemove scroll mousedown touchstart touchmove keydown resize onload", runLazyQueue);

// 担心未触发 onload 事件, 5s 之后执行懒加载队列
window.requestAnimationFrame(function() {
  runLazyQueue();
}, 5000);
```

