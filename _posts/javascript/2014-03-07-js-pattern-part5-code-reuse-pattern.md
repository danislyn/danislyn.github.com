---
layout: post
title: "Javascript模式之五-代码复用模式"
description: "本章中讲述了javascript中继承的实现方式，由于js中对象是基于原型链的，因此继承方式也分为类式继承（类似Java的继承语法）和原型继承。此外还能通过复制属性实现继承，混入、借用和绑定都可以扩展对象。"
category: javascript
tags: [javascript, 读书笔记]
---
{% include JB/setup %}

类式继承
---------
示例

	function Parent(name){
		this.name = name || 'Adam';
	}
	Parent.prototype.say = function(){
		return this.name;
	}

	function Child(name){}
	inherit(Child, Parent);

###阶段1 - 默认模式

	function inherit(C, P){
		C.prototype = new P();
	}

缺点：无法继承父对象自身的属性（如上例中的`name`）。

###阶段2 - 借用构造函数

	function Child(name){
		Parent.apply(this, arguments);
	}

缺点：只能继承在父构造函数中添加到`this`的属性。同时并不能继承那些已添加到原型中的成员。
优点：不会存在子对象意外覆盖父对象属性的风险。

###阶段3 - 借用和设置原型

	function Child(name){
		Parent.apply(this, arguments);
	}
	Child.prototype = new Parent();

缺点：父构造函数被调用了两次；自身的属性会被继承两次。

###阶段4 - 共享原型

	function inherit(C, P){
		C.prototype = P.prototype;
	}

本模式的经验法则在于：可复用成员应该转移到原型中而不是放置在`this`中。因此，出于继承的目的，任何值得继承的东西都应该放置在原型中实现。

###阶段5 - 临时构造函数

	function inherit(C, P){
		var F = function(){};
		F.prototype = P.prototype;
		C.prototype = new F();
	}

这种模式与阶段1略有不同，这是由于这里的子对象仅继承了原型的属性。这种情况通常来说是很好的，实际上也是更加可取的，因为原型也正是放置可复用功能的位置。在这种模式下，父构造函数添加到`this`中的任何成员都不会被继承。

###阶段6 - 圣杯

	function inherit(C, P){
		var F = function(){};
		F.prototype = P.prototype;
		C.prototype = new F();
		C.parent = P.prototype;
		C.prototype.constructor = C;
	}

这种模式也被称为使用代理函数或代理构造函数的模式，而不是使用临时构造函数的模式，这是因为临时构造函数实际上是一个用于获得父对象原型的代理。

对该圣杯模式的一个常见优化是避免在每次需要继承时都创建临时（代理）构造函数。仅创建一次临时构造函数，并且修改它的原型，这已经是非常充分的。

	var inherit = (function(){
		var F = function(){};
		return function(C, P){
			F.prototype = P.prototype;
			C.prototype = new F();
			C.parent = P.prototype;
			C.prototype.constructor = C;
		}
	}());

###阶段7 - Klass

特点：
1. 有一套有关如何命名类方法的公约，这也被认为是类的构造函数，比如`initialize`、`_init`以及一些其他类似的构造函数名，并且在创建对象时这些方法将会被自动调用。
2. 存在从其他类所继承的类
3. 在子类中可以访问父类或超类

使用示例

	var Man = Klass(null, {
		__construct: function(what){
			console.log('constructor of Man');
			this.name = what;
		},
		getName: function(){
			return this.name;
		}
	});

	var Batman = Klass(Man, {
		__construct: function(what){
			console.log('constructor of Batman');
		},
		getName: function(){
			var name = Batman.parent.getName.call(this);
			return 'I am ' + name;
		}
	});

	var bruce= new Batman('Bruce Wayne');  //控制台第一行输出'constructor of Man'，然后输出'constructor of Batman'
	bruce.getName();  //output: I am Bruce Wayne

每次在调用子类的构造函数时，父类的构造函数也将会被自动调用。

	bruce instanceof Man;  //true
	bruce instanceof Batman;  //true

具体实现

	var Klass = function(Parent, props){
		//1. 新构造函数
		var Child = function(){
			if(Child.parent && Child.parent.hasOwnProperty('__construct')){
				Child.parent.__construct.apply(this, arguments);
			}
			if(Child.prototype.hasOwnProperty('__construct')){
				Child.prototype.__construct.apply(this, arguments);
			}
		};

		//2. 继承
		Parent = Parent || Object;
		var F = function(){};
		F.prototype = Parent.prototype;
		Child.prototype = new F();
		Child.parent = Parent.prototype;
		Child.prototype.constructor = Child;

		//3. 添加实现方法
		for(var i in props){
			if(props.hasOwnProperty(i)){
				Child.prototype[i] = props[i];
			}
		}

		//返回该class
		return Child;
	};

说明：创建了`Child()`构造函数，该函数将是最后返回的，并且该函数也用作类。在这个函数中，如果存在`__construct`方法，那么将会调用该方法。另外，在此之前，通过使用静态`parent`属性，其父类的`__construct`方法如果存在的话也会被自动调用。可能在有些情况下，当没有定义`parent`属性时，比如直接从`Object`类中继承时，这与从`Man`类的定义中继承是相似的情况。


原型继承
---------
原型继承是一种“现代”无类继承模式，不涉及类，这个的对象都是继承自其他对象。以这种方式考虑：有一个想要复用的对象，并且想创建的第二个对象需要从第一个对象中获取其功能。

使用示例

	var parent = {
		name: 'papa'
	};
	var child = object(parent);
	alert(child.name);  //output: papa

具体实现

	function object(o){
		function F() {}
		F.prototype = o;
		return new F();
	}

**讨论**
在原型继承模式中，并不需要使用字面量来创建父对象（尽管这是一种比较常见的方式）。也可以使用构造函数来创建父对象，但请注意，如果这样做的话，自身（`this`）属性和原型属性都将被继承。

在本模式的另外一个变化中，可以选择仅继承现有构造函数的原型对象。请记住，对象继承自对象，而不论父对象是如何创建的。

	var kid = object(Person.prototype);

在ES5中，原型继承模式已经正式成为该语言的一部分。这种模式是通过方法`Object.create()`来实现的。也就是说，不需要推出与`object()`相类似的函数，它已经内嵌在该语言中。

	var child = Object.create(parent);

`Object.create()`接受一个额外的参数，即一个对象。这个额外对象的属性将会被添加到新对象中，以此作为新对象自身的属性，然后`Object.create()`返回该新对象。这提供了很大的方便，使你可以仅采用一个方法调用即可实现继承并在此基础上构建子对象。

	var child = Object.create(parent, {
		age: { value: 22 }  //ECMA5描述符号
	});


通过复制属性实现继承
----------------------
浅复制

	function extend(parent, child){
		child = child || {};
		for(var i in parent){
			if(parent.hasOwnProperty(i)){
				child[i] = parent[i];
			}
		}
		return child;
	}

深复制

	function extendDeep(parent, child){
		var toString = Object.prototype.toString;
		var astr = '[object Array]';
		
		child = child || {};
		for(var i in parent){
			if(parent.hasOwnProperty(i)){
				if(typeof parent[i] === 'object'){
					child[i] = (toString.call(parent[i]) === astr) ? [] : {};
						extendDeep(parent[i], child[i]);
					}
	               	else{
						child[i] = parent[i];
	               	}
	          	}
		}
		return child;
	}

这种属性复制模式比较简单且得到了广泛运用。例如，Firebug（使用Javascript编写的Firefox扩展插件）中具有一个名为`extend()`的方法，该方法就可以实现浅复制，而jquery库中的`extend()`则可创建深度复制的副本。
值得注意的是，在本模式中根本没有涉及任何原型，本模式仅与对象以及它们自身的属性相关。


混入
-----
可以针对这种通过属性复制实现继承的思想做进一步的扩展，就有了mix-in（混入）模式。mix-in模式并不是复制一个完整的对象，而是从多个对象中复制出任意的成员并将这些成员组合成一个新对象。

mix-in实现比较简单，只需遍历每个参数，并且复制出传递给该函数的每个对象中的每个属性。可以向它传递任意数量的对象，其结果将获得一个具有所有源对象属性的新对象。

	function mixin(){
		var child = {};
		for(var arg=0; arg<arguments.length; arg++){
			for(var prop in arguments[arg]){
				if(arguments[arg].hasOwnProperty(prop)){
					child[prop] = arguments[arg][prop];
				}
			}
		}
		return child;
	}


借用和绑定
------------

	function bind(o, m){
		return function(){
			return m.apply(o, [].slice.call(arguments));  
		};
	}

ES5中将`bind()`方法添加到`Function.prototype`，使得`bind()`就像`apply()`和`call()`一样简单易用。

	if(typeof Function.prototype.bind === 'undefined'){
		Function.prototype.bind = function(thisArg){
			var fn = this;
			var slice = Array.prototype.slice;
			var args = slice.call(arguments, 1);

			return function(){
				return fn.apply(thisArg, args.concat(slice.call(arguments)));
			};
		};
	}

这个实现可能看起来有点熟悉，它使用了部分应用并拼接了参数列表，即那些传递给`bind()`的参数（除了第一个以外），以及那些传递给由`bind()`所返回的新函数的参数，其中该新函数将在以后被调用。


参考
-----
[JavaScript模式](http://book.douban.com/subject/11506062/)