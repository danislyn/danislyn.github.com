---
layout: post
title: "JS中的闭包及使用场合"
category: javascript
tags: [javascript]
---
{% include JB/setup %}

对于JS中的闭包closure，官方给出的定义为：A "closure" is an expression (typically a function) that can have free variables together with an environment that binds those variables (that "closes" the expression)。

对此我的理解是：闭包是一个函数或函数表达式的执行环境；这个执行环境中会包含一些变量，只有函数内部能访问到这些变量；因此这些变量相当于被“包”住了，脱离了这个闭包，就无法访问到这些变量。

<!-- break -->

词法性质的作用域
-----------------
JS具有函数级的作用域，这意味着定义在函数内部的变量在函数外部不能被访问。

JS的作用域又是词法性质的（lexically scoped），这意味着函数运行在定义它的作用域中，而不是在调用它的作用域中。因此，函数执行时的变量可见性范围就是它被定义时的变量可见性范围。



闭包的创建方式
----------------
创建闭包最简单最通常的方式就是：创建一个[自执行函数](http://www.cnblogs.com/TomXu/archive/2011/12/31/2289423.html)，然后在其内部再嵌一个供外调用的函数，这样这个自执行函数就形成了一个闭包。

    var someVar = 'global';
    var someFunc;

    (function(){
        var someVar = 'inner';
        someFunc = function(){
            alert(someVar);
        };
    })();

    someFunc();

可以看到最后执行结果是“inner”，因为`someFunc`在自执行函数的闭包中被定义，虽然`someFunc`在自执行函数执行完后才被调用，但是**函数执行时可访问到的变量，就是该函数被定义时函数内部可访问到的变量**。因此`someFunc`定义时看到的`someVar`值是inner，就是最后执行时的结果。



使用场合
----------

### 减少全局变量 ###

闭包的最大作用就是**变量共享**，以减少全局变量的使用。举个例子

    var some = (function(){
        var count = 0;
        var doSomething = function(){
            for(var i=0; i<100; i++){
                count++;
            }
        }

        return {
            getResult: function(){
                doSomething();
                return count;
            }
        }
    })();

最后调用`some.getResult()`结果当然是100。对外部来说，我们只关心最后得到的结果，而无所谓它是怎么算出来的。因此在外部，只存在一个全局变量`some`，我们成功的将中间变量`count`和过程`doSomething`变成了闭包内的自由变量（上述定义中的free variables），而不是全局变量。内部函数`getResult`能访问到外部函数的变量，因此闭包能够减少全局变量的使用。


### 模块化模式 ###

由上面的再往下过渡，就是JS中的模块化模式了。这是面向对象的编程思想，用来管理方法和属性的可见度。在以前封装[学校选择器](/blog/2015/01/19/step-by-step-js-component-schoolbox-2#section-1)的时候，就写过一段面向对象的例子。

    var Book = (function(){
        // 私有静态属性
        var numOfBooks = 0;

        // 私有静态方法
        function checkIsbn(isbn){

        }

        // 返回真正的构造函数
        return function(newIsbn, newTitle, newAuthor){
            // 私有属性
            var isbn, title, author;

            // 特权方法（每个实例都会有一个方法的备份）
            this.getIsbn = function(){
                return isbn;
            };
            this.setIsbn = function(newIsbn){
                if(!checkIsbn(newIsbn)){
                    throw new Error('Book: ISBN无效');
                }
                isbn = newIsbn;
            };

            // 执行构造
            numOfBooks++;
            if(numOfBooks > 50){
                throw new Error('Book: 最多创建50个实例');
            }

            this.setIsbn(newIsbn);
        }
    })();

这里就是通过创建一个自执行函数，里面再返回一个函数，以实现类的构造函数，并将私有属性封装在内部。对外部来说，`Book`就是一个封装好的模块。注意，这里省略了`prototype`部分，具体请看[这里](/blog/2015/01/19/step-by-step-js-component-schoolbox-2#section-1)。


### 偏函数应用 ###

关于偏函数的具体定义，我也不是很清楚。不过很好理解，假设有个函数定义了3个参数，那么可以先把第一个参数的值绑定到该函数中，以后调用时只需要传入后两个参数值就可以了。

    function say(word){
        return function(name){
            alert(word + ' ' + name);
        }
    }

    var sayHello = say('Hello');
    sayHello('World');

我们想做的事是想写个`say(word, name)`这样的函数，可以先让`say('Hello')`返回一个函数，然后再传入第二个参数即可。这是偏函数的最最简单的例子。JS中支持可变参数，可以为偏函数绑定多个参数的值，也叫做*curry化*。更复杂的例子请看司徒先生的[这篇文章](http://www.cnblogs.com/rubylouvre/archive/2009/11/09/1598761.html)。


### 循环引用问题 ###

这是使用闭包的最经典的场合。先来看个例子。

    // 假设页面中有4个div
    var elems = document.getElementsByTagName('div');
    for(var i=0, len=elems.length; i<len; i++){
        var div = elems[i];
        div.onclick = function(){
            alert(i);
        };
    }

页面中有4个div元素，我们希望为它们绑上事件，点击第一个div弹出0，点击第二个div弹出1，依此类推。很可惜，上面的代码执行后，不管点击哪个div，弹出的都是4。这是为什么呢？当for循环结束时，`i`的值是4，因此当div元素被点击时，`onclick`函数内部看到的变量`i`值其实就是`i`最终的值，即4。

使用闭包可以解决这个问题

    var elems = document.getElementsByTagName('div');
    for(var i=0, len=elems.length; i<len; i++){
        (function(j){
            var div = elems[j];
            div.onclick = function(){
                alert(j);
            };
        })(i);
    }

在for循环里面创建了一个自执行函数，把当前的i值传进去，即匿名函数的参数j（为了区分我这里写成了`j`，当然令它为`i`也可以）。这样就形成了一个闭包，`onclick`执行时看到的变量`j`就是匿名函数的参数`j`。而匿名函数是自执行的，它在for循环中已经被执行过了，因此匿名函数的参数`j`的值就是它被定义时传入的变量`i`值。

如果我把代码改成这样

    var elems = document.getElementsByTagName('div');
    for(var i=0, len=elems.length; i<len; i++){
        (function(i){
            var div = elems[i];
            div.onclick = function(){
                alert(i);
            };
        })(i);
    }

依旧不会对结果产生影响，因为匿名函数在for循环中已经被执行过了，因此`onclick`中看到的`i`始终是匿名函数被定义时的参数`i`值，for循环的循环变量i不会对它产生影响。



总结
------
综上所以我感觉，闭包就像一个壳子，把它里面的东西罩住了。正如本文一开头引用的官方定义，闭包把它里面的free variables罩住了保护住了，使它们免受外部的污染，包括全局变量的污染，或者是循环变量终值的污染。因此闭包内部的函数运行时看到的变量值，就是它们被定义时看到的变量的值。

由于本篇写的是闭包的使用场合，解决循环引用问题只是其中的一种，还有更多循环引用的例子，我改天再写一篇^_^



参考文章
----------
[深入理解JavaScript系列（4）：立即调用的函数表达式](http://www.cnblogs.com/TomXu/archive/2011/12/31/2289423.html)

[javascript的currying函数](http://www.cnblogs.com/rubylouvre/archive/2009/11/09/1598761.html)
