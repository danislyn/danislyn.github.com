---
layout: post
title: "常用模式片段之 domReady"
category: javascript
tags: [javascript, 常用片段]
---
{% include JB/setup %}

第一次看到 domReady 这个字眼是在 jquery 中，即 document ready。之后也见到一些别人的代码里有 `DOMContentLoaded`，它和页面的 onload 有什么关系，以及和 document ready 有何渊源。以前都见过这些词，但都似懂非懂，今天查了些资料收集了些代码，做个完整的理解。

<!-- break -->

第一印象
--------
在 jquery 中，我们的第一个 hello world 程序，教程中可能会教如下的写法：

```
$(document).ready(function () {
	// $('#el').on('click', function () {})
});
```

jquery 也提供了一个更简洁的写法，即 `$(function(){...})`

那这样套了一层后，能保证里面的 js 代码会在页面 DOM 树都解析完后再执行。

```
<head>
	<script>
	$(function () {
		$('#el').html('hello');
	});
	</script>
</head>
<body>
	<div id="el"></div>
</body>
```

因为很久以前，我们都是习惯把 `<script>` 写在 `<head>` 中，而我们知道浏览器在解析 HTML 时，遇到 script 是会阻塞 DOM 的解析（*准确来说是增加 DOM 解析的回溯*）。因为浏览器要知道 script 里对页面干了哪些事，可能元素又会变化，所以要等中途的 script 执行完才能继续解析渲染后面的 DOM element。

我们可以拿下面的代码做个实验：

```
<body>
	<h1>hahaha</h1>
	<script>
		debugger
	</script>
	<div id="el">can you see me</div>
</body>
```

在浏览器中开 debug 模式，可以看到停在这行时，页面中能看到 `<h1>` 元素，但下面那个 `<div>` 还未解析到 DOM 树中。

因此，为了避免在文档还未解析完成前就操作 DOM（可能会报错），也为了让 *非页面前置依赖* 的脚本在 DOM 解析完后再执行，所有教程上都建议把能放在最后的脚本都放在最后。

```
<body>
	<h1>hahaha</h1
	<div id="el">can you see me</div>
	
	<script src="jquery.js"></script>
	<script>
		// 页面交互逻辑 ...
	</script>
</body>
```

回到最前面，`$(document).ready(fn)` 就是用来保证，如果不小心将 script 提到了前面，或者出于某些考虑一定要 script 提前，那么它将保证文档 DOM 都解析完后再执行 `fn` 内部的 js 逻辑。

要理解 document ready，首先得看下 document 的文档状态。


文档状态
--------
文档加载的状态都在 `document.readyState` 中，具体可参见 [MDN 上的定义](https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState)，它有三个状态值：

- loading：文档还在加载
- interactive：**document 已加载并解析完**，但文档里的资源（如样式、图片、iframe）仍在加载中
- complete：document 和文档里的资源都已加载完，意味着将触发 `load` 事件

### readystatechange 事件

当 `document.readyState` 值变化时，会触发 `readystatechange` 事件，可以用以下代码监听：

```
document.onreadystatechange = function () {
	if (document.readyState === 'interactive') {
		// initLoader ...
	}
	else if (document.readyState === 'complete') {
		// initApp ...
	}
}
```

等价的写法也可以是这样

```
document.addEventListener('readystatechange', function (event) {
	// event.target.readyState
});
```

### DOMContentLoaded VS onload

从 MDN 的定义中可以明确两件事

- `DOMContentLoaded` 在 `document.readyState === 'interactive'` 时触发，即页面 DOM 树已有，但样式、图片等资源还在加载中。
- `window.onload` 在 `document.readyState === 'complete'` 时触发，即页面 DOM 和其他资源都已加载完成。


```
document.addEventListener('DOMContentLoaded', function(event) {
    // 等同于 onreadystatechange 中的
    // document.readyState === 'interactive'
});

window.onload = function() {
	// 等同于 onreadystatechange 中的
	// document.readyState === 'complete'
});
```

后者还可以写成 `window.addEventListener('load', function(event) {})`，但要注意下 `addEventListener` 的兼容性方式（*attachEvent*）。

还有更多文档状态的事件，关于 `unload` & `beforeunload` 可参见[MDN示例](https://developer.mozilla.org/en-US/docs/Web/Events/unload)，这里先跳过了。


Polyfill
---------
从上一小节中可以看到，判断页面加载的状态，关键是 `readystatechange` 事件，在一个事件回调中可以判断 `document.readyState` 的三种状态。那这么 diao 的方式一定会存在兼容性问题的， [来自MDN](https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded)：

> Internet Explorer 8 supports the readystatechange event, which can be used to detect when the DOM is ready. In earlier versions of Internet Explorer, this state can be detected by repeatedly trying to execute document.documentElement.doScroll("left");, as this snippet will throw an error until the DOM is ready.

本文最初提到的 `$(document).ready(fn)`，等同于 `DOMContentLoaded` 的触发时刻，即 `document.readyState === 'interactive'` 的时刻。因此 jquery 在实现 ready 函数时，肯定要有很多兼容性的考虑。

### 初步兼容

```
document.ready = function (callback) {
    // 兼容 FF, Chrome
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', function () {
            document.removeEventListener('DOMContentLoaded', arguments.callee, false);
            callback();
        }, false)
    }
    // 兼容 IE
    else if (document.attachEvent) {
        document.attachEvent('onreadytstatechange', function () {
              if (document.readyState == "complete") {
                    document.detachEvent("onreadystatechange", arguments.callee);
                    callback();
               }
        })
    }
    else if (document.lastChild == document.body) {
        callback();
    }
}
```

这是网上收集的一段实现 ready 的代码，但是从上面 MDN 的定义中知道，IE 8 以下是不支持 `onreadystatechange` 事件的。

### 深度兼容

```
(function () {
    var ie = !!(window.attachEvent && !window.opera);
    var wk = /webkit\/(\d+)/i.test(navigator.userAgent) && (RegExp.$1 < 525);

    var fn = [];
    var run = function () {
        for (var i = 0; i < fn.length; i++) {
            fn[i]();
        }
    };

    var d = document;
    d.ready = function (f) {
        if (!ie && !wk && d.addEventListener) {
            return d.addEventListener('DOMContentLoaded', f, false);
        }
        
        if (fn.push(f) > 1) {
            return;
        }
        
        if (ie) {
            (function () {
                try {
                    d.documentElement.doScroll('left');
                    run();
                }
                catch (err) {
                    setTimeout(arguments.callee, 0);
                }
            })();
        }
        else if (wk) {
            var t = setInterval(function () {
                if (/^(loaded|complete)$/.test(d.readyState)) {
                    clearInterval(t);
                    run();
                }
            }, 0);
        }
    };
})();
```

可以看到这里就是用了 MDN 中提到的 `document.documentElement.doScroll("left")`，不断循环地去执行它，直到 DOM ready 时，它就不会抛异常了。这是一种值得学习的 trick 方式。

### jquery 官方实现

官方实现的代码和上面大体相似，我找了 jquery 1.4.4 的版本，因为之后 1.5.x 的 `ready` 函数实现中引入了类似 promise 中的一些概念，所以用之前的版本更能纯粹的理解 dom ready 的实现。

```
bindReady: function() {
	if ( readyBound ) {
		return;
	}

	readyBound = true;

	// Catch cases where $(document).ready() is called after the
	// browser event has already occurred.
	if ( document.readyState === "complete" ) {
		// Handle it asynchronously to allow scripts the opportunity to delay ready
		return setTimeout( jQuery.ready, 1 );
	}

	// Mozilla, Opera and webkit nightlies currently support this event
	if ( document.addEventListener ) {
		// Use the handy event callback
		document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
		
		// A fallback to window.onload, that will always work
		window.addEventListener( "load", jQuery.ready, false );

	// If IE event model is used
	} else if ( document.attachEvent ) {
		// ensure firing before onload,
		// maybe late but safe also for iframes
		document.attachEvent("onreadystatechange", DOMContentLoaded);
		
		// A fallback to window.onload, that will always work
		window.attachEvent( "onload", jQuery.ready );

		// If IE and not a frame
		// continually check to see if the document is ready
		var toplevel = false;

		try {
			toplevel = window.frameElement == null;
		} catch(e) {}

		if ( document.documentElement.doScroll && toplevel ) {
			doScrollCheck();
		}
	}
}
```

jquery 中 ready 函数最核心的部分就是上面这段，和前面[深度兼容](#section-6)的原理一致，但有一些特殊的 fallback 处理，还判断了在 IE 中是否是顶层 frame。源代码可参见以下链接：

- [ready 函数入口](https://github.com/jquery/jquery/blob/1.4.4/jquery.js#L275)

- [bindReady](https://github.com/jquery/jquery/blob/1.4.4/jquery.js#L458)

- [DOMContentLoaded handler](https://github.com/jquery/jquery/blob/1.4.4/jquery.js#L873)

- [doScrollCheck](https://github.com/jquery/jquery/blob/1.4.4/jquery.js#L458)

