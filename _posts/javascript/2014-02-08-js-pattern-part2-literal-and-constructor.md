---
layout: post
title: "Javascript模式之二-字面量和构造函数"
description: "对象创建方式<br>
对象字面量：这是一种优美的对象创建方式，它以包装在大括号中的逗号分割的键-值（key-value）对的方式创建对象。<br>构造函数：主要包括内置构造函数（几乎总是有一个更好且更短的字面量表示法）和自定义构造函数。"
category: javascript
tags: [javascript]
---
{% include JB/setup %}

对象创建方式
-------------
对象字面量：这是一种优美的对象创建方式，它以包装在大括号中的逗号分割的键-值（key-value）对的方式创建对象。
构造函数：主要包括内置构造函数（几乎总是有一个更好且更短的字面量表示法）和自定义构造函数。

example.

	//使用字面量
	var car = {goes: 'far'};
	//使用内置构造函数（反模式）
	var car = new Object();
	car.goes = 'far';

优先选择字面量模式创建对象的另一个原因在于它强调了该对象仅是一个可变哈希映射，而不是从对象中提取的属性或方法。
与使用`Object`构造函数相对，使用字面量的另一个原因在于它并没有作用域解析。因为可能以同样的名字创建了一个局部构造函数，解释器需要从调用`Object()`的位置开始一直向上查询作用域链，直到发现全局`Object`构造函数。

`Object()`构造函数仅接受一个参数，并且还依赖传递的值，该`Object()`可能会委派另一个内置构造函数来创建对象，并且返回了一个并非期望的不同对象。当传递给`Object()`构造函数的值是动态的，并且直到运行时才能确定其类型时，`Object()`构造函数的这种行为可能会导致意料不到的结果。因此，不要使用`new Object()`构造函数，相反应该使用更为简单、可靠的对象字面量模式。


自定义构造函数
----------------

	var Person = function(name){
		this.name = name;
		this.say = function(){
		return 'I am ' + this.name;
		};
	};

当以`new`操作符调用构造函数时，函数内部将会发生以下情况：
1. 创建一个空对象并且`this`变量引用了该对象，同时还继承了该函数的原型。
2. 属性和方法被加入到`this`引用的对象中。
3. 新创建的对象由`this`所引用，并且最后隐式地返回`this`（如果没有显式地返回其它对象）。

以上情况看起来就像是在后台发生了如下事情：

	var Person = function(name){
		//使用对象字面量创建一个新对象
		//var this = {};
		//向this添加属性和方法
		this.name = name;
		this.say = function(){
			return 'I am ' + this.name;
		};
		//return this;
	};

在本例中，将`say()`方法添加到`this`中，其造成的结果是在任何时候调用`new Person()`时都会在内存中创建一个新的函数。这种方法显然是低效的，因为多个实例之间的`say()`方法实际上并没有改变。更好的选择应该是将方法添加到`Person`类的原型中。可重用的成员，比如可重用的方法，都应该放置到对象的原型中。

本例中，`var this = {};`并不是真相的全部，因为“空”对象实际上并不空，它已经从`Person`的原型中继承了许多成员。因此，它更像是下面的语句：

	var this = Object.create(Person.prototype);

注意，构造函数将隐式地返回`this`，甚至于在函数中没有显式地加入`return`语句。但是，可以根据需要返回任意其他对象。


强制使用new的模式
-------------------
在调用构造函数时如果忘记使用`new`操作符，将导致构造函数中的`this`指向了全局对象（在浏览器中，`this`将会指向`window`）。

example.

	function Waffle(){
		this.tastes = 'yummy';
	}
	//反模式：忘记使用new操作符
	var mm = Waffle();
	console.log(typeof mm);  //output: undefined
	console.log(window.tastes);  //output: yummy

上面的这种意外行为在ECMAScript 5中得到了解决，并且在strict模式中，`this`不会指向全局对象。

**方案1：使用that**

	function Waffle(){
		var that = {};
		that.tastes = 'yummy';
		return that;
	}

这种模式的问题在于它会丢失到原型的链接，因此任何添加到`Waffle()`原型的成员，对于对象来说都是不可用的。

**方案2：自调用构造函数**

可以在构造函数中检查`this`是否为构造函数的一个实例，如果为否，构造函数可以再次调用自身，并且在这次调用中正确地使用`new`操作符。

example.

	function Waffle(){
		if(!(this instanceof Waffle)){
			return new Waffle();
		}
		this.tastes = 'yummy';
	}
	Waffle.prototype.wantAnother = true;

	var first = new Waffle();
	var second = Waffle();
	console.log(first.tastes);  //output: yummy
	console.log(second.tastes);  //output: yummy
	console.log(first.wantAnother);  //output: true
	console.log(second.wantAnother);  //output: true

另一种用于检测实例对象的通用方法是将其与`arguments.callee`进行比较，而不是在代码中硬编码构造函数名称。

	if(!(this instanceof arguments.callee)){
		return new arguments.callee();
	}

注：在ES5的strict模式中并不支持`arguments.callee`属性。
