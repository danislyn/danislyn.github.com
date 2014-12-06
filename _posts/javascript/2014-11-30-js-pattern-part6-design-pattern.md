---
layout: post
title: "Javascript模式之六-设计模式"
description: "拖了好久终于把欠着的章节整理完了，这章主要讲述了几种常用的设计模式在javascript中的实现。由于javascript是一种函数式动态语言，这些设计模式的实现会与Java这种静态语言有所不同。本章中涉及的模式包括：单体模式，工厂模式，装饰者模式，外观模式，策略模式，代理模式，中介者模式，观察者模式。"
category: javascript
tags: [javascript, 读书笔记]
---
{% include JB/setup %}

单体模式
---------
单体（Singleton）模式的思想在于保证一个特定类仅有一个实例。这意味着当第二次使用同一个类创建对象的时候，应该得到与第一次所创建对象完全相同的对象。

在js中，对象之间永远不会完全相等，除非它们是同一个对象，因此即使创建一个具有完全相同成员的同类对象，它也不会与第一个对象完全相同。

    var obj1 = {};
    var obj2 = {};
    obj1 == obj2;  //output: false

因此，可以认为每次在使用对象字面量创建对象的时候，实际上就是在创建一个单体。注意有时人们在js中所说的“单体”，就是指前面提到的“[模块模式](/javascript/2014/03/01/js-pattern-part4-object-creation-pattern/#section-1)”。

**1.通过静态属性实现单体**

    function Universe(){
        if(typeof Universe.instance === 'object'){
            return Universe.instance;
        }

        // 正常进行
        this.start_time = 0;

        // 缓存
        Universe.instance = this;

        // 隐式返回
        // return this;
    }

这种方法非常直接，但是缺点在于其`instance`属性是公开的，存在被恶意修改的隐患。

**2.通过闭包实现单体**

    function Universe(){
        // 缓存实例
        var instance = this;

        // 正常进行
        this.start_time = 0;

        // 重写该构造函数
        Universe = function(){
            return instance;
        };
    }

这种实现实际上是来自于前面提到的“[自定义函数](/javascript/2014/02/16/js-pattern-part3-function/#section-7)”模式的另一个例子。这种方法的缺点在于，重写构造函数会丢失所有在初始化定义和重定义时刻之间添加到它里面的属性。

    Universe.prototype.nothing = true;
    var uni = new Universe();
    Universe.prototype.everything = true;
    var uni2 = new Universe();

    uni.nothing;  //output: true
    uni2.nothing;  //output: true
    uni.everything;  //output: undefined
    uni2.everything;  //ouput: undefined

    // 结果看上去是正确的
    uni.constructor.name;  //ouput: "Universe"
    // 但这是奇怪的
    uni.constructor === Universe;  //output: flase

之所以`uni.constructor`不在与`Universe()`构造函数相同，是因为`uni.constructor`仍然指向了原始的构造函数，而不是重新定义的那个构造函数。

如果需要使原型和构造函数指针安装预期的那样运行，改进如下

    function Universe(){
        // 缓存实例
        var instance;

        // 重写构造函数
        Universe = function Universe(){
            return instance;
        };

        // 保留原型属性
        Universe.prototype = this;

        // 实例
        instance = new Universe();

        // 重置构造函数指针
        instance.constructor = Universe;

        // 所有功能
        instance.start_time = 0;

        return instance;
    }

另一种解决方案是将构造函数和实例包装在即时函数中，如下

    var Universe;
    (function(){
        var instance;
       
        Universe = function Universe(){
            if(instance){
                return instance;
            }

            instance = this;

            // 所有功能
            this.start_time = 0;
        };
    })();


工厂模式
----------
工厂模式的目的是为了创建对象，它通常在类或类的静态方法中实现，具有下列目标：

1.当创建相似对象时执行重复操作

2.当编译时不知道具体类型（类）的情况下，为工厂客户提供一种创建对象的接口

    // 父构造函数
    function CarMaker(){}

    CarMaker.prototype.drive = function(){
        return "Vroom, I hvae " + this.doors + ' doors';
    };

    // 静态工厂方法
    CarMaker.factory = function(type){
        var newcar;

        // 如果构造函数不存在，则发生错误
        if(typeof CarMaker[type] !== 'function'){
            throw {
                name: 'Error',
                message: type + ' doesn\'t exist'
            };
        }

        // 在这里，构造函数是已知存在的
        // 我们使得原型继承父类，但仅继承一次
        if(typeof CarMaker[type].prototype.drive !== 'function'){
            CarMaker[type].prototype = new CarMaker();
        }

        // 创建一个新的实例
        newcar = new CarMaker[type]();
        // 可选择性的调用一些方法后返回……
        return newcar;
    }

    // 定义特定的汽车制造商
    CarMaker.Compact = function(){
        this.doors = 4;
    };
    CarMaker.Convertible = function(){
        this.doors = 2;
    };
    CarMaker.SUV = function(){
        this.doors = 24;
    };

`factory`方法通过字符串指定类型来创建对象。继承部分仅是可以放进工厂方法的一个公用重复代码片段的范例，而不是对每种类型的构造函数的重复。

值得注意的是，js内置的`Object()`就是一个自然工厂，它根据输入类型而创建不同的对象。

    var s = new Object('1');
    var n = new Object(1);
    s.constructor === String;  //output: true
    n.constructor === Number;  //output: true


装饰者模式
-----------
装饰者模式的一个比较方便的特征在于其预期行为的可定制和可配置特性。可以从仅具有一些基本功能的普通对象开始，然后从可用装饰资源池中选择需要用于增强普通对象的那些功能，并且按照顺序进行装饰，尤其是当装饰顺序很重要的时候。

**1.使用继承实现**

    function Sale(price){
        this.price = price || 100;
    }
    Sale.prototype.getPrice = function(){
        return this.price;
    };

    // 以字符串的方式找到对象块拼接
    Sale.prototype.decorate = function(decorator){
        var F = function(){};
        F.prototype = this;
        var newObj = new F();
        newObj.super = F.prototype;

        var overrides = this.constructor.decorators[decorator];
        for(var i in overrides){
            if(overrides.hasOwnProperty(i)){
                newObj[i] = overrides[i];
            }
        }
        return newObj;
    }

    // 装饰者对象都将以构造函数的属性这种方式来实现
    Sale.decorators = {};

    Sale.decorators.fedtax = {
        getPrice: function(){
            var price = this.super.getPrice();
            price += price * 5 / 100;
            return price;
        }
    };

    Sale.decorators.cdn = {
        getPrice: function(){
            return 'CDN$ ' + this.super.getPrice().toFixed(2);
        }
    };

    用法
    var sale= new Sale(100);
    sale = sale.decorate('fedtax');
    sale = sale.decorate('cdn');
    sale.getPrice();  //output: CDN$ 105.00

**2.使用列表实现**

利用js语言的动态性质，根本不需要使用继承。此外，并不是使每个装饰方法调用链中前面的方法，我们可以简单地将前面方法的结果作为参数传递到下一个方法。

    function Sale(price){
        this.price = (price > 0) || 100;
        this.decorators_list = [];
    }

    Sale.decorators = {};
    Sale.decorators.fedtax = {
        getPrice: function(price){
            return price + price * 5 / 100;
        }
    };
    Sale.decorators.cdn = {
        getPrice: function(price){
            return 'CDN$ ' + price.toFixed(2);
        }
    };

    Sale.prototype.decorate = function(decorator){
        this.decorators_list.push(decorator);
    };

    Sale.prototype.getPrice = function(){
        var price = this.price;
        var name;

        for(var i=0, len=this.decorators_list.length; i<len; i++){
            name = this.decorators_list[i];
            price = Sale.decorators[name].getPrice(price);
        }
        return price;
    };

    用法
    var sale = new Sale(100);
    sale.decorate('fedtax');
    sale.decorate('cdn');
    sale.getPrice();  //output: CDN$ 105.00

在使用继承的实现方法中，`decorate()`具有一定的复杂性，而`getPrice()`非常简单。而在这里的实现中正好相反，`decorate()`进用于追加列表，而`getPrice()`却完成所有工作。这种实现方式更为简单，并且还可以很容易的支持反装饰或撤销装饰。

如果想拥有更多可以被装饰的方法，那么每个额外的装饰方法都需要重复遍历装饰者列表这一部分的代码。然而，这很容易抽象成一个辅助方法，通过它来接受方法并使其成为“可装饰”的方法。【接受方法？】在这样的实现中，`sale`中的`decorators_list`属性变成了一个对象，且该对象中的每个属性都是以装饰对象数组中的方法和值命名。【？】

【我的实现】

    Sale.prototype.getDecoratedValue = function(methodName){
        var value, name;
        var params = Array.prototype.slice.call(arguments, 1);

        for(var i=0, len=this.decorators_list.length; i<len; i++){
            name = this.decorators_list[i];
            value = Sale.decorators[name][methodName].apply(this, params);
            params = [value];
        }
        return value;
    };

    Sale.prototype.getPrice = function(){
        return this.getDecoratedValue('getPrice', this.price);
    };


策略模式
---------
策略模式支持在运行时选择算法。代码的客户端可以使用同一个接口来工作，但是它却根据客户正在试图执行任务的上下文，从多个算法中选择用于处理特定任务的算法。使用策略模式的一个例子是解决表单验证的问题。

    var validator = {
        // 所有可用的检查
        types: {},

        // 在当前验证会话中的错误消息
        messages: [],

        // 当前验证配置
        // key: 名称  value: 验证类型
        config: {},

        // 接口方法
        // data为key-value对
        validate: function(data){
            var msg, type, checker, result_ok;

            // 重置所有消息
            this.messages = [];

            for(var i in data){
                if(data.hasOwnProperty(i)){
                    type = this.config[i];
                    checker = this.types[type];

                    if(!type){
                        continue;  // 不需要验证
                    }
                    if(!checker){
                        throw {
                            name: 'ValidationError',
                            message: 'No handler to validate type ' + type
                        };
                    }

                    result_ok = checker.validate(data[i]);
                    if(!result_ok){
                        msg = 'Invalid value for *' + i + '*, ' + checker.instructions;
                        this.messages.push(msg);
                    }
                }
            }
            return this.hasErrors();
        },

        // 帮助方法
        hasErrors: function(){
            return this.messages.length > 0;
        }
    };

    // 非空值的检查
    validator.types.isNonEmpty = {
        validate: function(value){
            return value !== '';
        },
        instructions: 'the value cannot be empty'
    };

    // 检查是否是一个数字
    validator.types.isNumber = {
        validate: function(value){
            return !isNaN(value);
        },
        instructions: 'the value can only be a valid number'
    };

    // *****
    // 用法
    // *****
    var data = {
        name: 'fucky',
        age: 'unknown'
    };

    validator.config = {
        name: 'isNonEmpty',
        age: 'isNumber'
    };

    validator.validate(data);
    if(validator.hasErrors()){
        console.log(validator.messages.join('\n'));
    }

如上所示，`validator`对象是通用的，增强`validator`对象的方法是添加更多的类型检查。以后针对每个新的用例，所需做的就是配置该验证器并运行`validate()`方法。


外观模式
---------
外观（facade）模式是一种简单的模式，它为对象提供了一个可供选择的接口。这是一种很好的设计实践，可保持方法的简洁性并且不会使它们处理过多的工作。有时候，两个或更多的方法可能普遍的被一起调用，在这样的情况下，创建另一个方法以包装重复的方法调用是非常有意义的。

例如，当处理浏览器事件时，`stopPropagation()`和`preventDefault()`两个方法经常被一起调用。外观模式非常适合于浏览器脚本处理，据此可讲浏览器之间的差异隐藏在外观之后。

    var myevent = {
        stop: function(e){
            // IE
            if(typeof e.returnValue === 'boolean'){
                e.returnValue = false;
            }
            if(typeof e.cancelBubble === 'boolean'){
                e.cancelBubble = true;
            }
            // 其他
            if(typeof e.preventDefault === 'function'){
                e.preventDefault();
            }
            if(typeof e.stopPropagation === 'function'){
                e.preventDefault();
            }
        }
    };


代理模式
---------
在代理设计模式中，一个对象充当另一个对象的接口。它与外观模式的区别在于，在外观模式中你所拥有的是合并了多个方法调用的便利方法。代理则介于对象的客户端和对象本身之间，并且对该对象的访问进行保护。

这种模式可能看起来像是额外的开销，但是出于性能因素的考虑它却非常有用。代理充当了某个对象（也称为“本体对象”）的守护对象，并且试图使本体对象做尽可能少的工作。

使用这种模式的一个例子是延迟初始化（lazy initialization）。假设初始化本体对象开销非常大，而恰好又在客户端初始化该本体对象以后，应用程序实际上却从来没有使用过它。在这种情况下，首先由客户端发出一个初始化请求，然后代理以“一切正常”作为响应，但实际上并没有将该消息传递到本体对象，直到客户端明显需要本体对象完成一些工作的时候。只有到那个时候，代理才将两个消息一起传递。

另一个例子是将访问聚集为组，比如尽可能合并更多的http请求就很重要，节省网络开销。这一点有点像数据库里的 [batch insert](http://viralpatel.net/blogs/batch-insert-in-java-jdbc/)。

    var proxy = {
        ids: [],
        delay: 50,
        timeout: null,
        callback: null,
        context: null,

        makeRequest: function(id, callback, context){
            // 加入到队列中
            this.ids.push(id);

            this.callback = callback;
            this.context = context;

            // 设置超时时间
            if(!this.timeout){
                this.timeout = setTimeout(function(){
                    proxy.flush();
                }, this.delay);
            }
        },

        flush: function(){
            // http是处理请求的本体对象，仅有这一个方法
            http.makeRequest(this.ids, 'proxy.handler');

            // 清除超时设置和队列
            this.timeout = null;
            this.ids = [];
        },

        // JSONP的callback
        handler: function(data){
            // 单个结果
            if(parseInt(data.query.count, 10) === 1){
                proxy.callback.call(proxy.context, data.query.results.Video);
                return;
            }

            // 多个结果
            for(var i=0, len=data.query.results.Video.length; i<len; i++){
                proxy.callback.call(proxy.context, data.query.results.Video[i]);
            }
        }
    };

本例中，代理可以通过将以前的请求结果缓存到新的`cache`属性中，从而更进一步的保护对本体对象http的访问，节省网络往返消息。


中介者模式
-----------
在中介者模式中，独立的对象（称为colleague）之间并不直接通信，而是通过mediator对象。当其中一个colleague对象改变状态后，它将会通知该mediator，而mediator将会把该变化传达到任意其他应该知道此变化的colleague对象。

示例：按键游戏

    // 玩家
    function Player(name) {
        this.points = 0;
        this.name = name;
    }
    Player.prototype.play = function () {
        this.points += 1;
        mediator.played();
    };

    // 计分板
    var scoreboard = {
        // 待更新的HTML元素
        element: document.getElementById('results'),
       
        // 更新得分显示
        update: function (score) {
            var i, msg = '';
            for (i in score) {
                if (score.hasOwnProperty(i)) {
                    msg += '<p><strong>' + i + '<\/strong>: ';
                    msg += score[i];
                    msg += '<\/p>';
                }
            }
            this.element.innerHTML = msg;
        }
    };

    // 中介者对象
    var mediator = {
        // 所有玩家（player对象）
        players: {},
       
        // 初始化游戏
        setup: function () {
            var players = this.players;
            players.home = new Player('Home');
            players.guest = new Player('Guest');
        },
       
        // 如果有人玩，则更新得分值
        played: function () {
            var players = this.players,
                score = {
                    Home:  players.home.points,
                    Guest: players.guest.points
                };
               
            scoreboard.update(score);
        },
       
        // 处理用户交互
        keypress: function (e) {
            e = e || window.event; // IE
            if (e.which === 49) { // key "1"
                mediator.players.home.play();
                return;
            }
            if (e.which === 48) { // key "0"
                mediator.players.guest.play();
                return;
            }
        }
    };


    // 运行游戏
    mediator.setup();
    window.onkeypress = mediator.keypress;

    // 游戏在30秒内结束
    setTimeout(function () {
        window.onkeypress = null;
        alert('Game over!');
    }, 30000);


观察者模式
-----------
观察者模式广泛应用于客户端js编程中，所有的浏览器事件（鼠标悬停，按键等事件）都是该模式的例子。它的另一个名字也称为自定义事件（custom events），该模式的另一个别名是订阅/发布（subscriber/publisher）模式。

在这种模式中，并不是一个对象调用另一个对象的方法，而是一个对象订阅另一个对象的特定活动，并在状态改变后获得通知。订阅者也称为观察者，而被观察的对象称为发布者或主题。当发生了一个重要的事件时，发布者将会通知（调用）所有订阅者，并且可能经常以事件对象的形式传递消息。

示例：按键游戏

    // 发布者对象
    var publisher = {
        // 订阅者
        // key为订阅的消息类型（默认为'any'）
        // value为回调函数的列表
        subscribers: {
            any: []
        },

        // 即subscribe方法
        // context支持回调方法使用this以引用自己的对象
        on: function (type, fn, context) {
            type = type || 'any';
            fn = typeof fn === "function" ? fn : context[fn];
           
            if (typeof this.subscribers[type] === "undefined") {
                this.subscribers[type] = [];
            }
            this.subscribers[type].push({fn: fn, context: context || this});
        },

        // 即unsubscribe方法
        remove: function (type, fn, context) {
            this.visitSubscribers('unsubscribe', type, fn, context);
        },

        // 即publish方法
        // publication为传递给回调函数的参数
        fire: function (type, publication) {
            this.visitSubscribers('publish', type, publication);
        },

        // help遍历方法
        visitSubscribers: function (action, type, arg, context) {
            var pubtype = type || 'any',
                subscribers = this.subscribers[pubtype],
                i,
                max = subscribers ? subscribers.length : 0;
               
            for (i = 0; i < max; i += 1) {
                if (action === 'publish') {
                    // 支持回调方法使用this指向自身对象
                    // arg为传递给回调函数的参数，多参数请用对象包起来
                    subscribers[i].fn.call(subscribers[i].context, arg);
                } else {
                    // 取消订阅
                    if (subscribers[i].fn === arg && subscribers[i].context === context) {
                        subscribers.splice(i, 1);
                    }
                }
            }
        }
    };

    // 使一个对象成为一个发布者
    function makePublisher(o) {
        var i;
        for (i in publisher) {
            if (publisher.hasOwnProperty(i) && typeof publisher[i] === "function") {
                o[i] = publisher[i];
            }
        }
        // 非函数成员不能复用指针，需创建新对象
        o.subscribers = {any: []};
    }


    // 玩家
    function Player(name, key) {
        this.points = 0;
        this.name = name;
        this.key  = key;
        // 触发事件
        this.fire('newplayer', this);
    }
    Player.prototype.play = function () {
        this.points += 1;
        // 触发事件
        this.fire('play', this);
    };

    // 游戏控制
    var game = {
        // 记录玩家
        // key为按键，value为玩家对象
        keys: {},

        addPlayer: function (player) {
            var key = player.key.toString().charCodeAt(0);
            this.keys[key] = player;
        },

        // 处理用户交互
        handleKeypress: function (e) {
            e = e || window.event; // IE
            if (game.keys[e.which]) {
                game.keys[e.which].play();
            }
        },
       
        // 如果有人玩，则更新得分值
        handlePlay: function (player) {
            var i,
                players = this.keys,
                score = {};
           
            for (i in players) {
                if (players.hasOwnProperty(i)) {
                    score[players[i].name] = players[i].points;
                }
            }
            // 触发事件
            this.fire('scorechange', score);
        }
    };

    // 计分板
    var scoreboard = {
        // 待更新的HTML元素
        element: document.getElementById('results'),
       
        // 更新得分显示
        update: function (score) {
            var i, msg = '';
            for (i in score) {
                if (score.hasOwnProperty(i)) {
                    msg += '<p><strong>' + i + '<\/strong>: ';
                    msg += score[i];
                    msg += '<\/p>';
                }
            }
            this.element.innerHTML = msg;
        }
    };


    // 发布/订阅绑定
    makePublisher(Player.prototype);  // 注意Player要绑在prototype上，避免多份拷贝
    makePublisher(game);

    Player.prototype.on("newplayer", "addPlayer", game);
    Player.prototype.on("play",      "handlePlay", game);

    game.on("scorechange", scoreboard.update, scoreboard);

    window.onkeypress = game.handleKeypress;

    // 运行游戏
    var playername, key;
    while (1) {
        playername = prompt("Add player (name)");
        if (!playername) {
            break;
        }
        while (1) {
            key = prompt("Key for " + playername + "?");
            if (key) {
                break;
            }
        }
        new Player(playername,  key);   
    }


###中介者VS观察者

在中介者模式的实现中，`mediator`对象必须知道所有其他对象，以便在正确的时间调用正确的方法并且与整个游戏相协调。而在观察者模式中，`game`对象显得更缺乏智能，它主要依赖于对象观察某些事件并采取行动。比如，`scoreboard`监听`scorechange`事件。这导致了更为松散的耦合（越少的对象知道越少），其代价是在记录谁监听什么事件时显得更困难一点。

在本例的游戏中，所有订阅行为都出现在代码片段的同一位置，但是随着应用程序的增长，`on()`调用可能到处都是（例如在每个对象的初始化代码中）。这会使得该程序难以调试，因为现在无法仅在单个位置查看代码并理解到底发生了什么事情。在观察者模式中，可以摆脱那种从开始一直跟随到最后的那种过程式顺序代码执行的程序。


参考
-----
[JavaScript模式](http://book.douban.com/subject/11506062/)