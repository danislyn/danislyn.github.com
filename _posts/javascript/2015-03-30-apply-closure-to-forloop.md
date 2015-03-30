---
layout: post
title: "使用闭包解决循环引用问题"
category: javascript
tags: [javascript]
---
{% include JB/setup %}

上一篇讲了JS中的闭包以及它的几个使用场合，其中有一个就是解决循环引用问题，这篇我将用更多的例子再来看看这个问题。

<!-- break -->

问题来源
----------
假设页面中有4个div如下

    <div>111</div>
    <div>222</div>
    <div>333</div>
    <div>444</div>

现在要为每个div添加事件，以使点击它们时能弹出其innerHTML（点击第1个div弹出111，点击第4个div弹出444）。

    var elems = document.getElementsByTagName('div');
    for(var i=0, len=elems.length; i<len; i++){
        var div = elems[i];
        div.onclick = function(){
            alert(div.innerHTML);
        };
    }

结果并不是想的那样！当for循环结束时，其内部的`div`变量的最终值是第4个元素，因此当div元素被点击时，`onclick`函数内部看到的变量`div`值其实就是第4个元素，因此都弹出的是444。

再将代码改成这样

    var elems = document.getElementsByTagName('div');
    for(var i=0, len=elems.length; i<len; i++){
        elems[i].onclick = function(){
            alert(elems[i].innerHTML);
        };
    }

结果又与上面的错误不一样！当for循环结束时，最终`i`的值是4，因此当div元素被点击时，`onclick`内部`elems[i]`即`elems[4]`为undefined，无法弹出值。



使用闭包
----------
在[上一篇](/blog/2015/03/28/closure-in-js/#section-6)中，我们使用的闭包是这样的。

    var elems = document.getElementsByTagName('div');
    for(var i=0, len=elems.length; i<len; i++){
        (function(i){
            var div = elems[i];
            div.onclick = function(){
                alert(div.innerHTML);
            };
        })(i);
    }

但是有没有觉得这个闭包“包”的范围太大了，可以精简一下。

    var elems = document.getElementsByTagName('div');
    for(var i=0, len=elems.length; i<len; i++){
        var div = elems[i];
        div.onclick = (function(div){
            return function(){
                alert(div.innerHTML);
            };
        })(div);
    }

这里`onclick`绑的函数是一个匿名的自执行函数，该匿名函数以当前的div作为参数，自执行后又返回了一个函数才是真正的`onclick`函数。虽然比起前面一段代码，这段代码的闭包范围是小了点，但只是把前面闭包内部声明的变量div，变成了这段代码里匿名函数的参数。本质上闭包对变量的存储开销并没怎么省，上面的代码还能再改进。

    var elems = document.getElementsByTagName('div');
    for(var i=0, len=elems.length; i<len; i++){
        elems[i].onclick = (function(i){
            return function(){
                alert(elems[i].innerHTML);
            };
        })(i);
    }

这样的话，闭包中“记住”的变量更小。但是有没有注意到，在循环中会多次去生成同一个匿名函数（只不过自执行时传入的参数值不同），因此可以使用函数的引用进一步优化上面的代码。

    var elems = document.getElementsByTagName('div');
    var callback = function(i){
        return function(){
            alert(elems[i].innerHTML);
        };
    };

    for(var i=0, len=elems.length; i<len; i++){
        elems[i].onclick = (callback)(i);
    }

如此，`callback`函数仅存有一份，在for循环中为它传入不同的参数值进行执行，它返回的函数才是真正绑到`onclick`上的函数。



总结
-------
我再引用一句我在上一篇中的总结

> 闭包就像一个壳子，把它里面的东西罩住了。闭包把它里面的free variables保护住了，使它们免受外部的污染，包括全局变量的污染，或者是循环变量终值的污染。

虽然闭包有如此多的好处，但它也不是万能的，滥用闭包必然会有副作用。闭包中存在可能的效率问题，包括对象的建立和内存管理释放等，这些都不太好控制。我们只有先将闭包用在对的场合，然后尽量减少闭包“包”住的范围，避免循环中创建匿名函数，而使用函数的引用。
