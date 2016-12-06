---
layout: post
title: "常用模式片段之 domReady"
category: javascript
tags: [javascript, 常用片段]
published: false
---
{% include JB/setup %}


```
$(document).ready(function () {

});
```

文档状态
--------

document.readyState [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState)

- loading：文档还在加载
- interactive：**document 已加载并解析完**，但文档里的资源（如样式、图片、iframe）仍在加载中
- complete：document 和文档里的资源都已加载完，意味着将触发 `load` 事件

当 `document.readyState` 值变化时，会触发 `readystatechange` 事件，可以如下捕获

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

等价的写法

```
document.addEventListener('readystatechange', function (event) {
	// event.target.readyState
});
```


DOMContentLoaded VS onload

- `DOMContentLoaded` 在 `document.readyState === 'interactive'` 时触发
- `window.onload` 在 `document.readyState === 'complete'` 时触发

```
document.addEventListener('DOMContentLoaded', function(event) {
    // 等同于 document.readyState === 'interactive'
});
```

```
window.onload = function() {
	// 等同于 document.readyState === 'complete'
});
```

当然也可以写成 `window.addEventListener('load', function(event) {})`，注意下 `addEventListener` 的兼容性方式。

还有更多事件，关于 `unload` & `beforeunload` 可参见[MDN示例](https://developer.mozilla.org/en-US/docs/Web/Events/unload)


Polyfill
---------
兼容性 [来自MDN](https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded)

> Internet Explorer 8 supports the readystatechange event, which can be used to detect when the DOM is ready. In earlier versions of Internet Explorer, this state can be detected by repeatedly trying to execute document.documentElement.doScroll("left");, as this snippet will throw an error until the DOM is ready.

再来看 `$(document).ready()`，等同于 `DOMContentLoaded` 的触发时刻。

网上找来了一段实现 ready 的代码

```
document.ready = function (callback) {
    ///兼容FF,Google
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', function () {
            document.removeEventListener('DOMContentLoaded', arguments.callee, false);
            callback();
        }, false)
    }
     //兼容IE
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

如果考虑 IE6/7 的话，

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

jquery 官方实现

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

- [ready 函数](https://github.com/jquery/jquery/blob/1.4.4/jquery.js#L275)

- [bindReady](https://github.com/jquery/jquery/blob/1.4.4/jquery.js#L458)

- [doScrollCheck](https://github.com/jquery/jquery/blob/1.4.4/jquery.js#L458)

```
// The DOM ready check for Internet Explorer
function doScrollCheck() {
	if ( jQuery.isReady ) {
		return;
	}

	try {
		// If IE is used, use the trick by Diego Perini
		// http://javascript.nwbox.com/IEContentLoaded/
		document.documentElement.doScroll("left");
	} catch(e) {
		setTimeout( doScrollCheck, 1 );
		return;
	}

	// and execute any waiting functions
	jQuery.ready();
}
```

