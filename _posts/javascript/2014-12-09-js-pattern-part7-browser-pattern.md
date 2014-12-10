---
layout: post
title: "Javascript模式之七-浏览器模式"
description: "这个系列的文章终于整理完了，来自于Stoyan Stefanov的《JavaScript Patterns》一书，断断续续看了半年多，受益匪浅，整理了这些笔记。前面的章节讲述了Javascript的大部分核心模式，这些模式是和环境无关的。最后一章集中介绍了在特定客户端浏览器环境下的模式，这些内容包括：内容、表现和行为的分离，加速DOM操作，事件授权，远程脚本，以及脚本的载入性能。"
category: javascript
tags: [javascript, 读书笔记]
---
{% include JB/setup %}

关注分离
---------
HTML、CSS、JS相互独立，不要使用内联处理器（onclick之类）和内联样式属性（style属性），因为这些都不属于内容层。
js应该是用来加强网页功能，而不能称为网页正常工作的必需组件。

不要使用用户代理来嗅探代码路径，而应该在运行环境中检查是否有所需的属性或方法。

    // 反模式
    if(navigator.userAgent.indexOf('MSIE') !== -1){
        document.attachEvent('onclick', console.log);
    }

    // 比较好的做法
    if(document.attachEvent){
        document.attachEvent('onclick', console.log);
    }

    // 更具体的做法
    if(typeof document.attachEvent !== 'undefined'){
        document.attachEvent('onclick', console.log);
    }


DOM脚本
--------
DOM访问的代价是昂贵的，它是制约js性能的主要瓶颈，这是因为DOM通常是独立于js引擎而实现的。
总之，DOM的访问应该减少到最低，这意味着：

1. 避免在循环中使用DOM访问
2. 将DOM引用分配给局部变量，并使用这些局部变量
3. 在可能的情况下使用selector API（IE8以后都支持）
4. 当在HTML容器中重复使用时，缓存重复的次数

example.

	// 反模式
	for(var i=0;  i<100; i++){
	     document.getElementById('result').innerHTML += (i + ' , ');
	}
	
	// 更好的方式，使用了局部便利了
	var i, content = '';
	for(i=0; i<100; i++){
	     content += (i + ' , ');
	}
	document.getElementById('result').innerHTML += content;

为经常访问的元素增加`id`属性是一个很好的做法，因为`document.getElementById(myId)`是最简单快捷查找节点的方法。

除了访问DOM元素以外，对元素的增删改也很频繁。更新DOM会导致浏览器重新绘制屏幕，也会经常导致reflow（也就是重新计算元素的几何位置），这样会带来巨大的开销。

**1. 添加节点时，使用文档碎片（document fragment）**

    var p, t;
    var frag = document.createDocumentFragment();

    p = document.createElement('p');
    t = document.createTextNode('first paragraph');
    p.appendChild(t);
    frag.appendChild(p);

    p = document.createElement('p');
    t = document.createTextNode('second paragraph');
    p.appendChild(t);
    frag.appendChild(p);

    document.body.appendChild(frag);  // 只触发一次屏幕重绘

**2. 更新节点时，使用克隆镜像**

    var oldNode = document.getElementById('result');
    var clone = oldNode.cloneNode(true);

    // 处理克隆对象...

    // 更新到DOM
    oldNode.parentNode.replaceChild(clone, oldNode);  // 只触发一次重绘


事件授权
---------
事件授权模式得益于事件冒泡，会减少为每个节点附加的事件监听器数量。如果在`div`元素中有10个按钮，只需要为该`div`元素附加一个事件监听器就可以实现为每个按钮分别附加一个监听器的效果。

    function myHandler(e) {
        var src, parts;
        // 获取事件和源元素
        e = e || window.event;
        src = e.target || e.srcElement;

        // 过滤不感兴趣的事件源
        if (src.nodeName.toLowerCase() !== 'button') {
            return;
        }
       
        // 实际工作：更新标签
        parts = src.innerHTML.split(": ");
        parts[1] = parseInt(parts[1], 10) + 1;
        src.innerHTML = parts[0] + ": " + parts[1];
       
        // 无冒泡
        if (typeof e.stopPropagation === "function") {
            e.stopPropagation();
        }
        if (typeof e.cancelBubble !== 'undefined') {
            e.cancelBubble = true;
        }
       
        // 阻止默认操作
        if (typeof e.preventDefault === "function") {
            e.preventDefault();
        }
        if (typeof e.returnValue !== 'undefined') {
            e.returnValue = false;
        }
    }

    // 事件绑定
    var el = document.getElementById('click-wrap');
    if (document.addEventListener) { // W3C
        el.addEventListener('click', myHandler, false);
    } else if (document.attachEvent) { // IE
        el.attachEvent('click', myHandler);
    } else { // 终极手段
        el.onclick = myHandler;
    }

事件授权的缺点在于如果碰巧没有感兴趣的事件发生，那么增加的小部分代码就显得没用了。

YUI3中有一个`Y.delegate()`方法，该方法可以指定一个CSS选择器来匹配封装，并使用另外一个选择器来匹配感兴趣的节点。这是十分方便的，因为当事件在关注的节点之外发生时，回调函数实际上并没有被调用。

    function myHandler(e) {
        var src = e.target;
        var parts = src.get('innerHTML').split(": ");
        parts[1] = parseInt(parts[1], 10) + 1;
        src.set('innerHTML', parts[0] + ": " + parts[1]);
       
        e.halt();
    }

    YUI().use("event-delegate", function (Y) {
        Y.delegate('click', myHandler, "#click-wrap", "button");
    });

同样，jQuery中也有类似的接口。`$(selector).delegate(childSelector,event,data,function)`
参见<http://www.w3school.com.cn/jquery/event_delegate.asp>


长期运行脚本
-------------
可能会注意到有时候浏览器会提示某个脚本已经运行了很长时间，是否应该停止脚本。实际上无论要处理多么复杂的任务，都不希望应用程序发生上述事情。而且，如果该脚本的工作十分繁重，那么浏览器的UI将会无法响应用户的任何操作，应该尽量避免。

在js中没有线程，但是可以在浏览器中使用`setTimeout()`来模拟线程。这样做的思想是将一个大任务分解为多个小任务，并为每一个小任务设置timeout为1毫秒。虽然这样会导致完成整个任务需要耗费更长的时间，但是通过这样做，可以使得用户接口保持响应，用户体验较好。

注意，timeout时间设置为1毫秒（或者0毫秒）实际上是与浏览器和操作系统有关的。0毫秒不意味着没有timeout，而是指尽可能快的处理。例如在IE中，最快的时钟周期是15毫秒。

最近的浏览器为长期运行的脚本提供了另外一个解决方案：Web Workers。它为浏览器提供了背景线程支持，可以将任务比较繁重的计算放在单独一个文件中，从主程序（网页）中调用该文件。


远程脚本
---------

### XMLHttpRequest

XMLHttpRequest是一个在大多数浏览器中都支持的特殊对象。建立一个HTTP请求分为如下三个步骤：

1. 建立一个XMLHttpRequest对象（简写为XHR）
2. 提供一个回调函数来告知请求对象改变状态
3. 发送请求

但是在IE 7.0之前的版本中，XHR功能性是以ActiveX对象的方式实现的，因此对于那些版本需要做一些特殊处理。

    var xhr;
    var activeXids = [
        'MSXML2.XMLHTTP.3.0',
        'MSXML2.XMLHTTP',
        'Microsoft.XMLHTTP'
    ];

    if (typeof XMLHttpRequest === "function") { // 原生XHR
        xhr =  new XMLHttpRequest();       
    } else { // IE 7.0之前版本
        for (var i = 0; i < activeXids.length; i += 1) {
            try {
                xhr = new ActiveXObject(activeXids[i]);
                break;
            } catch (e) {}
        }
    }

    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) {
            return false;
        }
        if (xhr.status !== 200) {
            alert("Error, status code: " + xhr.status);
            return false;
        }
        document.body.innerHTML += "<pre>" + xhr.responseText + "<\/pre>";
    };

    xhr.open("GET", "page.html", true);
    xhr.send("");

### JSONP

JSONP（JSON with Padding）是另外一种创建远程请求的方法。和XHR有所不同，它不受同一个域浏览器策略的限制，出于从第三方网站载入数据的安全考虑，需要小心使用。

对应于XHR请求，JSONP的请求可以是任意类型的文档：

- XML文档（过去常用）
- HTML块（现在十分常见）
- JSON数据（轻量级，方便）
- 简单文本文件或者其他文档

对于JSONP，最常见的是用函数调用封装的JSON，函数名由请求方提供。JSONP请求的URL通常格式如，
`http://example.org/getdata.php?callback=myHandler`
getdata.php可以是任意类型的网页，`callback`参数指定采用哪个js函数来处理该请求的返回值。

然后像这样将URL载入到动态的`<script>`元素

    var script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);

服务器响应JSONP数据，这些数据将作为回调函数的参数。最终的结果是在网页中包含了一个新脚本，该脚本碰巧是一个函数调用。但需注意的是，JSONP中的回调函数必须是一个公有的和全局有效的函数。

### 框架和图像灯塔

使用框架也是一种处理远程脚本的备选方案。可以使用js创建一个`iframe`元素，并修改其`src`属性的url，新的URL可以包含更新调用者（在iframe之外的父页面）的数据和函数调用。

使用远程脚本最简单的场景是在只需要向服务器发送数据，而无需服务器回应的时候。在这种情形下，可以创建一个新图像，并将其`src`属性设置为服务器上的脚本文件，如下所示：

`new Image().src = 'http://example.org/some/page.php';`

这种模式称为图像灯塔（image beacon），这在希望向服务器发送日志数据时非常有用。举例来说，该模式可以用于收集访问者统计信息。因为用户并不需要服务器对这些日志数据的响应，通常的做法是服务器用一个1x1像素的GIF图片来作为响应（虽然这是一种不好的模式）。使用"204 Not Content"这样的HTTP响应是更好的选择，该HTTP响应的意思是指仅向客户端发送HTTP报头文件，而不发送HTTP内容体。


脚本载入性能
-------------
脚本元素会阻止下载网页内容。浏览器可以同时下载多个组件，但一旦遇到一个外部脚本文件后，浏览器会停止进一步下载，直到这个脚本文件下载、解析并执行完毕。为了最小化阻止的影响，可以将脚本元素放置于网页的最后部分，刚好在`</body>`标签之前。

也有一些模式可以防范这个问题：

1. 使用XHR请求载入脚本，并使用`eval()`将其转换为字符串。缺点是该方法受同一个域的限制，并且使用了`eval()`这种不好的模式。
2. 使用`defer`和`async`属性。缺点是这种方法并不能在所有浏览器上都有效。
3. 使用动态的`<script>`元素

### 动态script元素

    var script = document.createElement('script');
    script.src = 'all_20141209.js';
    document.documentElement.firstChild.appendChild(script);

上面的过程不会阻塞网页文件中其他部分的下载。但该模式的缺点在于如果js脚本依赖于载入主js文件，那么采用该模式后不能有其他脚本元素。主js文件是异步载入的，因此无法保证该文件什么时候能够载入完毕，所以紧跟着主js文件的脚本可能要假定对象都还未定义。

为了解决该缺点，可以让所有内联的脚本都不要立即执行，而是将这些脚本都收集起来放在一个数组里面。然后当主脚本文件载入完毕后，就可以执行所有缓存数组中收集的函数了。

首先，创建一个数组来存储所有内联代码，这部分代码应该放在页面文件尽可能前面的位置。

    var myNamespace = {
         inlineScripts: []
    };

    然后，需要将所有单独的内联脚本封装到一个函数中，并将每个函数增加到inlineScripts数组中。

    // 过去是
    // <script>console.log('inline');</script>
    // 修改为
    <script>
    myNamespace.inlineScripts.push(function(){
         console.log('inline');
    });
    </script>

    最后，循环执行缓存中的所有内联脚本。

    for(var i=0, len=myNamespace.inlineScripts.length; i<len; i++){
         myNamespace.inlineScripts[i]();
    }

### script元素位置

上面的例子中，documentElement是指`<html>`，而它的第一个子元素就是`<head>`

`document.documentElement.firstChild.appendChild(script);` 

通常也可以这样写

`document.getElementsByTagName('head')[0].appendChild(script);`

可以在网页中不使用`<head>`和`<body>`，尽管document.body通常能够在没有`<body>`标签时正常运作。但是实际上有一个标签一直会在脚本运行的网页中存在，那就是`<script>`标签，如果没有它，那么里面的js代码就不会运行。基于以上事实，可以在网页中使用`insertBefore()`来在第一个有效的元素之前插入元素。

    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);

### 延迟加载

    window.onload = function(){
         var script = document.createElement('script');
         script.src = 'all_lazy_20141209.js';
         document.documentElement.firstChild.appendChild(script);
    };

这样的做法符合渐进增强的思想，一部分代码是用于初始化页面并将事件附加到UI元素上，而第二部分代码只在用户交互或者其他条件下才用得上，因此这部分内容可以在用户浏览该页面时在后台载入。对于许多应用程序来说，延迟加载的代码部分远远大于立即加载的核心部分，因为很多有趣的操作（例如拖放、XHR和动画等）只在用户触发后发生。

### 按需加载

上面的模式在页面载入后，无条件地载入附加的js脚本，假定这些代码极有可能用得上。如果只载入那些确实需要的代码，请使用按需加载模式。可以创建一个`require()`函数，该函数包含需要加载的脚本的名称和当附加脚本加载后需要执行的回调函数。用法如下

    require('extra.js', function(){
         functionDefinedInExtraJS();
    });

require函数的实现

    function require(file, callback) {
        var script = document.getElementsByTagName('script')[0],
            newjs = document.createElement('script');

        // IE
        newjs.onreadystatechange = function () {
            if (newjs.readyState === 'loaded' || newjs.readyState === 'complete') {
                callback();
            }
        };

        // 其他浏览器
        newjs.onload = function () {
            callback();
        };
       
        newjs.src = file;
        script.parentNode.insertBefore(newjs, script);
    }

在IE中订阅`readystatechange`事件，并寻找`readyState`状态为"loaded"或"complete"的状态。而在Firefox、Safari和Opera中，需要通过`onload`属性订阅`load`事件。注意：这种方法不适用于Safari 2，如果需要，请创建一个时间间隔来定期检查是否指定变量已定义（在附加文件中定义的变量）。当该变量被定义以后，就意味着新脚本已经加载并执行了。

### 预加载模式

在延迟加载和按需加载模式中，我们延迟加载当前页面需要的脚本。此外，还可以延迟加载当前页面不需要，但是在后续页面中可能需要的脚本。这样，当用户打开接下来的网页后，所需要的脚本已经预先加载了，进而用户会感觉速度加快了。

预加载可以使用动态脚本模式来实现，但是这意味着该脚本将被解析和执行。解析仅仅会增加预加载的时间，而执行脚本可能会导致js错误，因为这些脚本应该是在第二个页面执行的，例如寻找某个特定的DOM节点。

可以加载脚本而并不解析和执行这些脚本，在IE中可以使用图像灯塔来发出请求。在所有其他浏览器中可以使用一个`<object>`来代替脚本元素，并将其`data`属性指向脚本的URL。

    var preload; 
    if (/*@cc_on!@*/false) { // 使用条件注释的IE嗅探
        preload = function (file) {
            new Image().src = file;
        };
    } else {
        preload = function (file) {
            var obj = document.createElement('object');
            // 避免显示出该对象
            obj.width = 0;
            obj.height = 0;
            obj.data = file;
           document.body.appendChild(obj);
        };
    }

注意：上面的代码使用了分支注释来嗅探IE，该方法比在`navigator.userAgent`中寻找字符串要安全一些，因为那些字符串很容易被用户修改。`var isIE = /*@cc_on!@*/false;` 会在除IE外的其他浏览器中将`isIE`设置为`false`，因为在注释语句中有一个`!`，因此在IE中`isIE`的值为`true`。

这种模式的缺点在于使用了用户代理嗅探，但是这是无法避免的。因为在这种情况下，使用特性检测技术无法告知关于浏览器行为的足够信息。举例来说，在这种模式下如果 `typeof Image === 'function'`，那么理论上可以用该函数来代替嗅探。然而在这里该方法没有作用，因为所有浏览器都支持 `new Image();` 区别仅仅在于有的浏览器为图像有独立的缓存，这也就意味着作为图像预加载的组件不会被用作缓存中的脚本，因此下一个页面会再次下载该图像。

预加载模式可以用于各种类型组件，而不限于脚本。举例来说，这在登录页面就十分有用。当用户开始输入用户名时，可以使用输入的时间来启动预加载，因为用户下一步极有可能进入登录后的界面。


参考
-----
[JavaScript模式](http://book.douban.com/subject/11506062/)