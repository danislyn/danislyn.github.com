---
layout: post
title: "Javascript模式之四-对象创建模式"
description: "命名空间模式；模块模式；沙箱模式；链模式"
category: javascript
tags: [javascript, 读书笔记]
---
{% include JB/setup %}

命名空间模式
--------------

	var MYAPP = MYAPP || {};
	MYAPP.namespace = function(ns_string){
		var parts = ns_string.split('.');
		var parent = MYAPP;
		
		//剥离最前面的冗余全局变量
		if(parts[0] === 'MYAPP'){
			parts = parts.slice(1);
		}

		for(var i=0; i<parts.length; i++){
			//如果它不存在，就创建一个属性
			if(typeof parent[parts[i]] === 'undefined'){
				parent[parts[i]] = {};
			}
			parent = parent[parts[i]];
		}
		return parent;
	};

	//使用
	var module2 = MYAPP.namespace('MYAPP.modules.module2');
	module2 === MYAPP.modules.module2;  //true


模块模式
----------

	MYAPP.namespace('MYAPP.utilities.array');
	MYAPP.utilities.array = (function(){
		//依赖
		var uobj = MYAPP.utilities.object;
		var ulang = MYAPP.utilities.lang;

		//私有属性
		var array_string = '[object Array]';
		var ops = Object.prototype.toString;

		//私有方法
		//...

		//可选的一次性初始化过程
		//...

		//公有API
		return {
			isArray: function(a){
				return ops.call(a) === array_string;
			},
			//更多方法和属性...
		};
	}());

模块模式的变体
揭示模块模式：所有的方法都需要保持私有性，并且只能暴露那些最后决定设立API的那些方法。
创建构造函数的模块：包装了模块的即时函数最终将会返回一个函数，而不是返回一个对象。
将全局变量导入到模块中：将全局变量以参数的形式传递到包装了模块的即时函数中。


沙箱模式
---------
沙箱模式提供了一个可用于模块运行的环境，且不会对其他模块和个人沙箱造成任何影响。
在命名空间模式中，有一个全局对象。在沙箱模式中，则是一个全局构造函数，让我们称之为`Sandbox()`。可以使用该构造函数创建对象并且还可以传递回调函数，它变成了代码的隔离沙箱运行环境。

使用示例

	Sandbox(['dom', 'event'], function(box){
		//使用DOM和事件来运行...

		Sandbox('ajax', function(box){
			//另一个沙箱
			//使用Ajax来处理...
		});

		//这里没有Ajax模块
	});

使用本沙箱模式时，可以通过将代码包装到回调函数中从而保护全局命名空间。可以根据所需要的模块类型创建不同的沙箱实例，并且这些实例互相独立运行。

具体实现

	function Sandbox(){
		//将参数转换成一个数组
		var args = Array.prototype.slice.call(arguments);
		//最后一个参数是回调函数
		var callback = args.pop();
		//模块可以作为一个数组传递，或作为单独的参数传递
		var modules = (args[0] && typeof args[0] === 'string') ? args : args[0];

		//确保该函数作为够咱函数被调用
		//参见"Javascript模式之二"中的"强制使用new模式"
		if(!(this instanceof Sandbox)){
			return new Sandbox(modules, callback);
		}

		//需要向this添加的属性
		//example
		this.a = 1;
		this.b = 2;

		//现在向该核心this对象添加模块
		//不指定模块名称或制定'*'，都表示使用所有模块
		if(!modules || modules === '*'){
			modules = [];
			for(i in Sandbox.modules){
				if(Sandbox.modules.hasOwnProperty(i)){
					modules.push(i);
				}
			}
		}
	     
		//初始化所需的模块
		for(var i=0; i<modules.length; i++){
			Sandbox.modules[modules[i]](this);
		}
	     
		//回调
		//注：改变的是this即回调函数的参数box所拥有的属性和方法
		callback(this);
	}

	//需要的任何原型属性
	Sandbox.prototype = {
		name: 'My Application',
		version: '1.0',
		getName: function(){
			return this.name;
		}
	};

	//添加模块
	Sandbox.modules = {};

	Sandbox.modules.dom = function(box){
		box.getElement = function(){};
		box.getStyle = function(){};
		box.foo = 'bar';
	};

	Sandbox.modules.event = function(box){
		//如果需要，就访问Sandbox原型，如下语句
		//box.constructor.prototype.m = 'mmm';
		box.attachEvent = function(){};
		box.dettachEvent = function(){};
	};

	Sandbox.modules.ajax = function(box){
		box.makeRequest = function(){};
		box.getResponse = function(){};
	};

在这个示例实现中，我们并不关心从其他文件中加载所需的功能，但这绝对也是一个可选的实现功能。比如YUI3库中就支持这种功能。
当我们知道所需的模块时，便可以据此进行初始化，这表示可以调用实现每个模块的函数。
该构造函数的最后一个参数是一个回调函数。该回调函数将会在使用新创建的实例时最后被调用。这个回调函数实际上是用户的沙箱，它可以获得一个填充了所需功能的`box`对象。

我觉得沙箱模式的缺点是`Sandbox.modules`暴露在外，应该使用更好的[AMD(Asynchronous Module Definition)](http://addyosmani.com/writing-modular-js/)模式


链模式
--------
链模式的优点在于它可以帮助你考虑分割函数，以创建更加简短、具有特定功能的函数，而不是创建尝试实现太多功能的函数。从长远看来，这提高了代码的可维护性。
链模式的缺点在于以这种方式编写的代码更加难以调试。或许知道在某个特定的代码行中发生错误，但是在此行中实际执行了太多的步骤。当链中多个方法的其中一个静默失效时，无法知道是哪一个方法发生失效。
在任何情况下，识别出这种模式都很有好处。当编写的方法并没有明显和有意义的返回值时，可以总是返回`this`。

`method()`方法思想（并不是很推荐）

example.

	var Person = function(name){
		this.name = name;
	}.
		method('getName', function(){
			return this.name;
		}).
		method('setName', function(name){
			this.name = name;
			return this;
		});

	var a = new Person('Adam');
	a.setName('Eve').getName();

`method()`方法实现

	if(typeof Function.prototype.method !== 'function'){
		Function.prototype.method = function(name, implementation){
			this.prototype[name] = implementation;
			return this.
		}
	}


参考
-----
[JavaScript模式](http://book.douban.com/subject/11506062/)