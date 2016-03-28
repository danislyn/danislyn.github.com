---
layout: post
title: "几道JS面试题-吉祥三宝"
category: javascript
tags: [javascript, 面试]
---
{% include JB/setup %}

现在坐在去北京的高铁上，刚才玩了两把极品飞车，配着列车的座位和颠簸，很带感！眼睛累了，最近确实比较忙，又是拖了好久就想写的博客，在这个特殊的地方，强烈抵制自己的拖延症！

上一篇JS面试题都是基本数据类型，同一个人面试的话不会问太多，而JS中的原型、作用域和闭包是面试官问的最多的，我称之为“吉祥三宝”。

<!-- break -->

作用域
--------
说白了就是某个函数执行时`this`指向谁的问题。

问题1：

    var obj = {
        run: function(){
            function test(){ alert(this); }
            test();
        }
    };

    obj.run();

`obj.run()`进入函数主体时，因为调用者是`obj`，因此`run()`内部`this`是指向`obj`的。但是`run()`内部又定义了一个function，直接执行了`test()`，因此`test()`内部的`this`未显式指定，`this`默认指向就是`window`。


问题2：

    var name = 'window';
    var obj = {
        name: 'obj',

        child: {
            // name: 'child',

            getName: function () {
                return this.name;
            }
        }

    };

    var getName = obj.child.getName;
    alert(getName());
    alert(obj.child.getName());

因为直接把`obj.child.getName`赋给了`getName`变量，因此`getName`就是个function，直接调用`getName()`时其内部`this`指向的是默认值`window`，因此alert结果是`window`。

而调用`obj.child.getName()`时，指定了调用者对象，因此函数内部的`this`指向`obj.child`对象。由于`child`里面的`name`给我注释掉了，因此`obj.child.getName()`里访问不到`this.name`，就alert出`undefined`（`obj.name`是用来迷惑的）。如果将此注释去掉的话，alert结果就是`child`。


问题3：

    function a(x, y){
        y = function(){
            x = 2;
        };

        return function(){
            var x = 3;
            y();
            console.log(x);
        }.apply(this, arguments);
    }

    a();

这题是在[ruanyf](http://weibo.com/ruanyf)老师的微博上看到的，意思是很难的一道面试题，在console里试了下才想通了结果。

执行`a()`未传入实际参数，所以`a()`刚进入时，`x``y`都是`undefined`。然后对`y`变量赋值成一个函数，函数内部将改变`x`的值，这里的`x`就是`a`函数定义时的形式参数`x`。

**函数定义时括号里的叫形式参数，JS中函数调用时传入的实际参数可与形式参数数目不一致。**而`arguments`指的是实际参数，因此`a()`里面`this`指向`window`，而`arguments`就是空数组。

然后执行`a()`里面的匿名函数，重新定义了局部变量`x = 3`，然后调用匿名函数外部的`y()`。而上面已说`y`内部改变的是`a`函数的形式参数`x`的值，因此不会影响匿名函数内部的`x`，所以输出结果就是3。这里也可以用闭包来解释，`console.log(x)`看到的就是匿名函数内部的变量`x`，`y`函数内部看不到匿名函数内部的变量。



原型
-------
原型prototype是用来实现JS中的对象继承的，具体可看我以前这篇[Javascript模式之五-代码复用模式](/blog/2014/03/07/js-pattern-part5-code-reuse-pattern)。

问题1：

    var A = function(){
        this.name = 'A';
    };
    A.prototype.say = function(){
        alert(this.name);
    };

    var B = function(){ };

Q1：写段代码让B继承A

    var F = function(){};
    F.prototype = A.prototype;
    B.prototype = new F();

我使用了[圣杯模式](/blog/2014/03/07/js-pattern-part5-code-reuse-pattern#section-6)的思想来继承，通过一个中间的空函数，使得B的原型对象实例最小，不会包含A的实例变量`name`。

Q2：下面输出结果是多少？

    var objB = new B();
    objB.say();

如果按照我上面那种继承方法的话，由于B的原型对象其实`F`的实例（F的原型指向A的原型），`F`的实例中并没有`name`属性，所以`objB.say()`访问不到`this.name`，结果就是`undefined`啦。

如果上面的继承代码改成`B.prototype = new A()`就这一句，那么B的原型对象就是`A`的实例，因此B的原型中就有`A`的实例属性`name`，所以`objB.say()`能访问到`this.name`。


问题2：

    Function.prototype.f = function(){};
    Object.prototype.o = function(){};

    function Factory(){}

    var car = new Factory();

Q：能调用`car.f()`和`car.o()`吗？

首先`car`是个new出来的对象，而JS中所有对象的原型链追溯到顶层都是`Object`，即**所有对象都继承自Object**，因此`car.o()`肯定没问题。

`typeof car`是`object`，而`car.constructor`是`Factory`。`typeof Factory`是`function`，而**JS中所有function的constructor默认都是`Function`**，因此`Factory.f()`是能调用到的。即`car.constructor.f()`能调用到，而`car.f()`是无法调用到的。



闭包
------
面试中问闭包问的最多的就是循环引用问题，我在[使用闭包解决循环引用问题](/blog/2015/03/29/apply-closure-to-forloop)这篇文章中已经列出很多例子了。比如，有一个数组`var array = [1, 2, 3, 4]`，请每隔1秒依次输出数组中的元素。这里就不多写了。



总结
------
JS中的原型、作用域和闭包是非常重要的，这是语言机制，也是这个语言的魅力。有了扎实的基础，再去理解模块化就会容易些，然后再了解一些RequireJS，就能得到面试官的喜欢，至少基础关没太大问题。
