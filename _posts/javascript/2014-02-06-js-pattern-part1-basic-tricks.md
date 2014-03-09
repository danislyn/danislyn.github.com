---
layout: post
title: "Javascript模式之一-基本技巧"
description: ""
category: javascript
tags: [javascript]
---
{% include JB/setup %}

基本概念-面向对象
------------------
Javascript是一门面向对象的语言。只有五种基本类型不是对象：数值类型、字符串类型、布尔类型、空类型和未定义类型。其中前三个类型有对应的以基本类型封装形式体现的对象表示。

在JavaScript中，一旦定义好了变量，同时也就已经正在处理对象了。首先，该变量会自动成为内置对象的一个属性，成为激活对象（如果该变量是一个全局变量，那么该变量会成为全局对象的一个属性）。第二，该变量实际上也是伪类，因为它拥有其自身的属性（称为attributes），该属性决定了该变量是否可以被修改、被删除和在一个for-in循环中进行枚举。这些属性在ECMAScript3中没有直接对外提供，但在第5版本的ECMAScript中，提供了一个特殊的描述符方法来操纵这些属性。

函数实际上也是对象，函数有属性和方法。
一个对象仅仅是一个容器，该容器包含了命名的属性、键值对的列表。这里面的属性可以是函数（函数对象），这种情形下我们称其为方法。一个“空对象”实际上并不是完全空白的，它包含有一些内置属性，但是没有其自身的属性。

关于创建的对象的另外一件事情是可以在任意时间修改该对象（尽管ECMAScript5引入了API来防止突变）。可以对一个对象执行添加、删除和更新它的成员变量。

最后需要记住的是对象主要有两种：
原生的（Native），在ECMAScript标准中有详细描述。
主机的（Host），在主机环境中定义的（例如浏览器环境）。
原生的对象可以进一步分为内置对象（例如数组、日期对象等）和用户自定义对象（例如`var o={};`）等。
主机对象包含windows对象和所有的DOM对象。

JavaScript中没有类。Javascript只处理对象。
JavaScript没有继承，通常使用原型来实现继承。
原型是一个对象，并且创建的每一个函数都会自动获取一个`prototype`属性，该属性指向一个新的空对象。该默认的原型对象几乎等同于采用对象字面量或`Object()`创建的对象，区别在于它的`constructor`属性指向了所创建的函数，而不是指向内置的`Object()`函数。

example.

	var func = function(){};
	console.log(func.constructor);  //output: function Function() { [native code] }
	console.log(func.prototype);  //output: Object {}
	console.log(func.prototype.constructor);  //output: function (){}

	var obj = {};
	console.log(obj.constructor);  //output: function Object() { [native code] }


全局变量的问题
----------------
全局变量的问题在于它们在整个Javascript应用或Web页面内共享，它们生存于同一个全局命名空间内，总有可能发生命名冲突。要尽可能少地使用全局变量，如使用命名空间模式或自执行立即生效函数（the self-executing immediate functions），但最重要的方法还是使用`var`声明变量。

Javascript总是在不知不觉中就出人意料地创建了全局变量，其原因在于Javascript的两个特性。第一个特性是Javascript可直接使用变量，甚至无需声明。第二个特性是Javascript有个暗示全局变量（implied globals）的概念，即任何变量，如果未经声明，就为全局对象所有（也就像正确声明过的全局变量一样可以访问）。

注：在ECMAScript5 strict模式中，为没有声明的变量赋值会抛出错误。

另一种创建隐式全局变量的反模式是带有`var`声明的链式赋值。

example.
	
	function foo(){
		var a = b = 0;
		//...
	}

在这代码片段中，`a`是局部变量，`b`是全局变量，这也许并不是你想要的。这源于从右至左的操作符优先级。首先，优先级较高的是表达式`b=0`，此时`b`未经声明。表达式的返回值为`0`，它被赋给`var`声明的局部变量`a`，如以下代码表示：

	var a = (b = 0);


变量释放时的副作用
-------------------
隐式全局变量与明确定义的全局变量有细微的不同，不同之处在于能否使用`delete`操作符撤销变量。
使用`var`创建的全局变量（这类变量在函数外部创建）不能删除。
不使用`var`创建的隐式全局变量（尽管它是在函数内部创建）可以删除。
这表明隐式全局变量严格来讲不是真正的变量，而是全局对象的属性。属性可以通过`delete`操作符删除，但变量不可以。


提升-凌散变量的问题
--------------------
Javascript允许在函数的任意地方声明多个变量，无论在哪里声明，效果都等同于在函数顶部进行声明。这就是所谓的“提升”。只要变量是在同一个范围（同一函数）里，就视为已经声明，哪怕是在变量声明前就使用。

example.

	myname = 'global';
	function func(){
		alert(myname);  //output: undefined
		var myname = 'local';
	   	alert(myname);  //output: local
	}
	func();

等同于

	myname = 'global';
	function func(){
		var myname;  //等同于 var myname = undefined;
		alert(myname);  //output: undefined
		myname = 'local';
		alert(myname);  //output: local
	}
	func();

注：仅仅是变量声明提升了，赋值仍在原来的位置。


for循环
--------
for循环性能提升建议：
1. 缓存遍历对象的长度，尤其是DOM元素。每次访问任何容器的长度时，也就是在查询活动的DOM。
2. 逐步减至0，这样通常更快，因为同0比较更有效率。

example.

	for(var i=elements.length-1; i>=0; i--){...}
	//或
	for(var i=elements.length; i--; ){...}

for-in循环用来遍历非数组对象，也被称为枚举。当遍历对象属性时，使用`hasOwnProperty()`来过滤原型链的属性。

example.

	for(var i in obj){
		if(obj.hasOwnProperty(i)){...}
		//或
		if(Object.prototype.hasOwnProperty(obj, i)){...}
	}


避免使用eval()
---------------
“`eval()`是一个魔鬼”。该函数可以将任意字符串当做一个Javascript代码来执行。当需要讨论的代码是预先就编写好了（不是在动态运行时决定），是没有理由使用`eval()`的。使用`eval()`存在安全隐患，因为这样做有可能执行被篡改过的代码（例如来自网络的代码）。这是在处理来自一个Ajax请求的JSON响应时常见的反模式，最好是使用浏览器内置的方法来解析JSON数据，以确保安全性和有效性。对于原生不支持`JSON.parse()`的浏览器来说，可以使用来自JSON.org网站的类库。

还有一点，通过`setInterval()`、`setTimeout()`和`function()`等构造函数来传递参数，在大部分情形下，会导致类似`eval()`的隐患。

example.

	//反模式 
	setTimeout('myFunc()', 1000);
	setTimeout('myFunc(1, 2, 3)', 1000);

	//推荐的模式 
	setTimeout(myFunc, 1000);
	setTimeout(function(){
		myFunc(1, 2, 3);
	}, 1000);


如果一定要使用`eval()`，那么可以考虑使用`new Function()`来替代`eval()`。这样做的一个潜在好处是由于在`new Function()`中的代码将在局部函数空间中运行，因此代码中任何采用`var`定义的变量不会自动成为全局变量。另一个避免自动成为全局变量的方法是将`eval()`调用封装到一个即时函数中。

example.

	var jsstring = 'var one = 1; console.log(one);';
	eval(jsstring);  //output: 1

	jsstring = 'var two = 2; console.log(two);';
	(function(){
		eval(jsstring);
	}());  //output: 2

	console.log(typeof one);  //output: number
	console.log(typeof two);  //output: undefined

另一个`new Function()`和`eval()`的区别在于`eval()`会影响到作用域链，而`Function()`更多地类似于一个沙盒。无论在哪里执行`Function`，它都仅仅能看到全局作用域，因此对局部变量的影响较小。
在接下来的例子中，`eval()`可以访问和修改它外部作用域的变量，然而`Function`不行（请注意使用`Function`和使用`new Function`是一样的）。

example.

	(function(){
		var local = 1;
		eval('local = 3; console.log(local);');  //output: 3
		console.log(local);  //output: 3
	}());
	
	(function(){
		var local = 1;
		Function('console.log(typeof local);')();  //output: undefined
	}());
