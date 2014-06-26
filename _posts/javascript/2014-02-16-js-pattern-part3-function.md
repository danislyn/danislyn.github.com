---
layout: post
title: "Javascript模式之三-函数"
description: "Javascript中函数有两个重要特征。<br>
第一，函数是第一类对象（first-class object），可以作为带有属性和方法的值以及参数进行传递。<br>
第二，函数提供了局部作用域。Javascript中仅存在函数作用域，花括号`{}`并不提供局部作用域，因此如果在`if`条件语句或在`for`以及`while`循环中，使用`var`关键字定义一个变量，这并不意味着该变量对于`if`或`for`来说是局部变量。它仅对于包装函数来说是局部变量，并且如果没有包装函数，它将称为一个全局变量。<br>
此外，函数中声明的局部变量可被提升到局部作用域的顶部。"
category: javascript
tags: [javascript]
---
{% include JB/setup %}

背景
------
Javascript中函数有两个重要特征。
第一，函数是第一类对象（first-class object），可以作为带有属性和方法的值以及参数进行传递。
第二，函数提供了局部作用域。Javascript中仅存在函数作用域，花括号`{}`并不提供局部作用域，因此如果在`if`条件语句或在`for`以及`while`循环中，使用`var`关键字定义一个变量，这并不意味着该变量对于`if`或`for`来说是局部变量。它仅对于包装函数来说是局部变量，并且如果没有包装函数，它将称为一个全局变量。
此外，函数中声明的局部变量可被提升到局部作用域的顶部。


函数创建方式
-------------
**1、命名函数表达式。**

	var add = function add(a, b){...};

注：不要将命名函数表达式分配给一个具有不同名称的变量，因为可能在某些浏览器下不支持。如`var foo = function bar(){};`

**2、函数表达式。**
与上面的相同，但缺少一个名字，通常也称为匿名函数。

	var add = function add(a, b){...};

唯一的区别在于该函数对象的`name`属性将会成为一个空字符串或`undefined`。
`name`属性是Javascript语言的一个扩展（它并不是ECMA标准的一部分），可用于debug时错误定位，也可用于在自身内部递归调用同一个函数。

**3、函数声明。**

	function foo(){...}

就语法而言，命名函数表达式与函数声明看起来很相似，尤其是如果不将函数表达式的结果分配给变量。
在尾随的分号中，这两者之间存在语法差异。函数声明中并不需要分号结尾，但在函数表达式中需要分号，并且应该总是使用分号（在压缩js文件时会出问题）。


函数的提升
-----------
对于所有变量，无论在函数体的何处进行声明，都会在后台被提升到函数顶部。而这对于函数同样适用，其原因在于函数只是分配给变量的对象。当使用函数声明时，函数定义也被提升，而不仅仅是函数声明被提升。

example.

	function hoistMe(){
		console.log(typeof foo);  //output: function
		console.log(typeof bar);  //output: undefined
		
		foo();  //output: local foo
		bar();  //output: TypeError: bar is not a function

		//函数声明，变量'foo'及其实现都被提升
		function foo(){
			alert('local foo');
		}

		//函数表达式，仅变量'bar'被提升，函数实现并未被提升
		var bar = function(){
			alert('local bar');
		};
	}
	hoistMe();


API模式-回调模式
-----------------
example.普通写法

	var findNodes = function(){
		var i = 100000;
		var nodes = [];
		var found;
		while(i--){
			//复杂逻辑...
			nodes.push(found);
		}
		return nodes;
	};

	var hide = function(nodes){
		for(var i=0, max=nodes.length; i<max; i++){
			nodes[i].style.display = 'none';
		}
	};

	//执行函数
	hide(findNodes());

实现低效，因为`hide()`必须再次遍历由`findNodes()`所返回的数组节点。如果在`findNodes()`中实现`hide`逻辑，由于检索和修改逻辑耦合，那么它不再是一个通用函数。对这种问题的解决办法是采用回调模式。

example.回调模式

	var findNodes = function(callback){
		var i = 100000;
		var nodes = [];
		var found;

		//检查回调函数是否为可调用的
		if(typeof callback !== 'function'){
			callback = false;
		}

		while(i--){
			//复杂逻辑...
			if(callback){
				callback(found);
			}
			nodes.push(found);
		}
		return nodes;
	};

	//执行函数
	findNodes(function(node){
		node.style.display = 'none';
	});

注：回调函数可以是一个已有的函数，也可以是一个匿名函数，可以在调用主函数时创建它。

虽然在许多情况下这种方法都是简单而且有效的，但经常存在一些场景，其回调并不是一次性的匿名函数或全局函数，而是对象的方法。如果该回调方法使用`this`来引用它所属的对象，就会导致问题。
解决办法是传递回调函数，并且另外还传递该回调函数所属的对象。

example.

	var findNodes = function(callback, callback_obj){
		//...
		if(typeof callback === 'string'){
			callback = callback_obj[callback];
		}
		if(typeof callback === 'function'){
			callback.call(callback_obj, found);
		}
		//...
	};


API模式-配置对象
-----------------
将函数参数包装成一个对象，如`addPerson(param)`
配置对象的优点在于：不需要记住众多的参数以及其顺序；可以安全忽略可选参数；易于阅读和维护；易于添加和删除参数。
配置对象的不利之处在于：需要记住参数名称；属性名称无法被压缩。


API模式-返回函数
-----------------

	var setup = function(){
		var count = 0;
		return function(){
			return (count += 1);
		};
	};
	var next = setup();
	next();  //returns: 1
	next();  //returns: 2

由于`setup()`包装了返回函数，它创建了一个闭包，可以使用这个闭包存储一些私有数据，而这些数据仅可被该返回函数访问，但外部代码却无法访问。


API模式-Curry化
-----------------
例子，有`function add(a, b){...}`

函数应用：`add.apply(null, [1, 2]);`

部分应用：`(add.apply(null, [1]))(2);`

注：部分应用中，`add.apply(null, [1])`仅应用了第一个参数，当执行部分应用时，并不会获得具体结果，而是会获得另一个函数，随后再以其他参数调用该返回函数。这种运行方式实际上与`add(1)(2)`有些相似，这是由于`add(1)`返回了一个可在后来用`(2)`来调用的函数。

example.

	function add(x, y){
		if(typeof y === 'undefined'){
			//部分应用
			return function(y){
				return x + y;  
			};
		}
		//完全应用
		return x + y;
	}

使函数理解并处理部分应用的过程就称为Curry过程。

example.通用Curry化函数

	function schonfinkelize(fn){
		var slice = Array.prototype.slice;
		var stored_args = slice.call(arguments, 1);
		return function(){
			var new_args = slice.call(arguments);
			var args = stored_args.concat(new_args);
			return fn.apply(null, args);
		};
	}

注：Javascript中`arguments`并不是一个真实的数组，从`Array.prototype`中借用`slice()`方法可以帮助我们将`arguments`变成一个数组，并且使用该数组工作更加方便。

	//普通函数
	function add(x, y){
		return x + y;
	}

	//将一个函数Curry化以获得一个新的函数
	var newadd = schonfinkelize(add, 1);
	newadd(2);  //returns: 3
	//等价于 schonfinkelize(add, 1)(2);

转换函数`schonfinkelize()`并不局限于单个参数或者单步Curry化。
当发现正在调用同一个函数，并且传递的参数绝大多数都是相同的，那么该函数可能是用于Curry化的一个很好的候选参数。可以通过将一个函数集合部分应用到函数中，从而动态创建一个新函数。这个新函数将会保存重复的参数（因此不必每次都传递这些参数），并且还会使用预填充原始函数所期望的完整参数列表。


初始化模式-即时函数
--------------------
即时函数模式是一种可以支持在定义函数后立即执行该函数的语法。
`(function(){...}());` 或 `(function(){...})();`
这种模式非常有用，因为它为初始化代码提供了一个作用域沙箱，不会污染全局变量。

一般情况下，全局对象是以参数方式传递给即时函数的，这样将使得代码在浏览器环境之外时具有更好的互操作性。

	(function(global){
		//通过'global'访问全局变量
	}(this));

一般来说，不应该传递过多的参数到即时函数中。

正如任何其他函数一样，即时函数可以返回值，并且这些返回值也可以分配给变量。
即时函数模式得到了广泛的使用，它可以帮助包装许多想要执行的工作，且不会在后台留下任何全局变量。该模式还支持将个别功能包装在自包含模块中。


初始化模式-即时对象初始化
--------------------------
example.

	({
		width: 600,
		height: 400,
	    getXXX: function(){...},
	    init: function(){
			//更多初始化任务...
	    }
	}).init();

注：如果想在`init()`完毕之后保存对该对象的一个引用，可以通过在`init()`尾部添加`return this;`语句来实现该功能。

就语法而言，这种模式就像在使用对象字面量创建一个普通的对象。将字面量包装到括号中（分组操作符），它指示Javascript引擎将大括号作为对象字面量，而不是作为一个代码块。在结束该括号之后，可以立即调用`init()`方法。
`({...}).init();` 或 `({...}.init());`
这种模式的优点与即时函数模式的优点是相同的，可以在执行一次性的初始化任务时保护全局命名空间。


初始化模式-初始化时分支
------------------------
初始化时分支，也称为加载时分支，是一种优化模式。当知道某个条件在整个程序生命周期内都不会发生改变的时候，仅对该条件测试一次是很有意义的。浏览器嗅探（或功能检测）就是一个典型的例子。


性能模式-备忘模式
------------------
函数是对象，因此它们具有属性。事实上，它们确实还有属性和方法。例如，对于每一个函数，无论使用什么样的语法来创建它，它都会自动获得一个`length`属性，其中包含了该函数期望的参数数量。
可以在任何时候将自定义属性添加到你的函数中。自定义属性的其中一个用例是缓存函数返回值，也被称为备忘。

example.

	var myFunc = function(param){
		if(!myFunc.cache[param]){
			var result = {};
			//开销很大的操作...
			myFunc.cache[param] = result;
		}
		return myFunc.cache[param];
	};
	myFunc.cache = {};

上述代码假定该函数只需要一个参数`param`，并且它是一个基本数据类型。如果有更多更复杂的参数，对此的通用解决方案是将它们序列化。例如，可以将参数对象序列化为一个JSON字符串，并使用该字符串作为`cache`对象的键。

	var cachekey = JSON.stringify(Array.prototype.slice.call(arguments));

注意：在序列化过程中，对象的“标识”将会丢失。如果有两个不同的对象并且恰好都具有相同的属性，则它们序列化后的结果相同。


性能模式-自定义函数
---------------------
example.

	var scareMe = function(){
		alert('Boo!');
		scareMe = function(){
		alert('Double boo!')；
		};
	};
	scareMe();  //output: Boo!
	scareMe();  //output: Double boo!

当你的函数有一些初始化准备工作要做，并且仅需要执行一次，那么这种模式就非常有用。因为并没有任何理由去执行本可以避免的重复工作，即函数的一些部分可能并不再需要。在这种情况下，自定义函数可以更新自身的实现。
这种模式的另一个名称是“惰性函数定义”（lazy function definition），因为该函数直到第一次使用时才被正确地定义，并且具有后向惰性，执行了更少的工作。该模式的其中一个缺点在于，当它重定义自身时，已经添加到原始函数的任何属性都会丢失。此外，如果该函数使用了不同的名称，比如分配给不同的变量或者以对象的方法来使用，那么重定义部分将永远不会发生，并且将会执行原始函数体。

example.接上

	//1、添加一个新的属性
	scareMe.property = 'properly';
	//2、赋值给另一个不同名称的变量
	var prank = scareMe;
	//3、作为一个方法使用
	var spooky = {
		boo: scareMe
	};
	
	//calling with a new name
	prank();  //output: Boo!
	prank();  //output: Boo!
	console.log(prank.property);  //output: properly

	//作为一个方法来调用
	spooky.boo();  //output: Boo!
	spooky.boo();  //output: Boo!
	console.log(spooky.boo.property);  //output: properly

	//使用自定义函数
	scareMe();  //output: Double boo!
	scareMe();  //output: Double boo!
	console.log(scareMe.property);  //output: undefined

正如看到的，当将该函数分配给一个新的变量时，函数的自定义并没有发生。每次当调用`prank()`时，它都通知'Boo!'消息，同时它还覆盖了全局`scareMe()`函数，但是`prank()`自身保持了可见旧函数，其中还包括属性。当该函数以`spooky`对象的`boo()`方法使用时，也发生了同样的情况。所有这些调用不断地重写全局`scareMe()`指针，以至于当它最终被调用时，它才第一次具有更新函数主体并通知'Double boo!'消息的权利。此外，它也不能访问`scareMe.property`属性。
