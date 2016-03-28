---
layout: post
title: "一步步做组件-学校选择器(8)"
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

最近面试经常拿这个[学校选择器](/blog/2015/02/11/step-by-step-js-component-schoolbox-collections)作为例子来讲自己的JS学习过程，有位工程师哥哥直接打开[这里](http://mooctest.net/)“注册”里的第二步，就是我这个功能最初应用的地方。跟他讨论实现模态时事件的unbind[这种方式](/blog/2015/02/25/step-by-step-js-component-schoolbox-7#section-2)是不是不好时，他给了我一点启发，于是我回过头来重新思考。

<!-- break -->

问题来源
----------
假设页面上有这么三行元素

    <div>
        <input type="text" class="school-input" readonly/>
        <input type="text" class="school-id" readonly>
        <a href="javascript:void(0)" class="choose-school">选择学校</a>
    </div>
    <div>
        <input type="text" class="school-input" readonly/>
        <input type="text" class="school-id" readonly>
        <a href="javascript:void(0)" class="choose-school">选择学校</a>
    </div>
    <div>
        <input type="text" class="school-input" readonly/>
        <input type="text" class="school-id" readonly>
        <a href="javascript:void(0)" class="choose-school">选择学校</a>
    </div>

想要对每行都“选择学校”，并将选中的值填回该行中的`input`元素中，最早代码是酱紫的。

    $('.choose-school').click(function(event){
        var $source = $(this);

        // 监听自定义事件
        schoolBox.on('schoolChosen', function(data){
            $source.siblings('.school-input').val(data.schoolName);
            $source.siblings('.school-id').val(data.schoolId);
        });

        schoolBox.show();
    });

当点一个元素时没问题，但是点了两个三个元素后，就会发现每次“选择学校”后都会一起刷新。原因就在于这三个元素都把各自的回调加绑到了`schoolChosen`事件中，而`schoolBox`的`schoolChosen`被触发时，它会依次调用绑到它身上的handlers。

在SchoolBox内部的实现中，使用一个map来记录所有的事件回调，key是事件名称，而value是监听该事件的回调函数的数组。

    SchoolBox.prototype = {
        on: function(type, handler){
            if(typeof this.handlers[type] === 'undefined'){
                this.handlers[type] = [];
            }
            this.handlers[type].push(handler);
        },
        fire: function(type, data){
            if(this.handlers[type] instanceof Array){
                var handlers = this.handlers[type];
                for(var i=0, len=handlers.length; i<len; i++){
                    handlers[i](data);
                }
            }
        }
    };

因此以上实现代码是有弊端的，页面上多个元素共享同一个模态对话框时，无法正确地响应事件。

在上一篇[一步步做组件-学校选择器(7)](/blog/2015/02/25/step-by-step-js-component-schoolbox-7#section-2)中使用了一种暴力的解决办法，每次click时都对SchoolBox对象unbind掉所有的事件，然后重新监听，以保证每次打开SchoolBox时handlers map中该事件类型的回调函数只有唯一的一个。很明显这种做法不是很妥。



从监听上入手
-------------
由于上面的代码在监听时只绑定事件名称，不区分监听者元素，因此很容易想到在`on`监听时把当前操作的元素ID连同回调函数一起传入。这样的话，SchoolBox内部的handlers的map格式要稍微改下，即`{ eventType1: { sourceId1: function(){} } }`这样的格式。

    SchoolBox.prototype = {
        on: function(type, sourceId, handler){
            if(typeof this.handlers[type] === 'undefined'){
                this.handlers[type] = {};
            }
            this.handlers[type][sourceId] = handler;
        },
        fire: function(type, data){
            var handler = this.handlers[type][this.curSourceId];
            handler && handler(data);
        }
    };

这里`on`时由`type + sourceId`来确定handler，注意这里`fire`时根据`type + this.curSourceId`来取出相应的handler回调函数。而这个`this.curSourceId`需要在SchoolBox每次被打开的时候更新，每次被关闭的时候清空其值。

    SchoolBox.prototype.show = function(sourceId){
        // 记录当前打开SchoolBox的触发元素
        if(sourceId){
            this.curSourceId = sourceId;
        }

        //以下省略...
    };

    SchoolBox.prototype.hide = function(){
        // 清空sourceId触发元素
        if(this.curSourceId){
            this.curSourceId = null;
        }

        //以下省略...
    };

最后应用层的监听代码就像这样

    $('.choose-school').click(function(){
        var $source = $(this);
        var id = $source.attr('id');

        // 监听自定义事件
        schoolBox.on('schoolChosen', id, function(data){
            $source.siblings('.school-input').val(data.schoolName);
            $source.siblings('.school-id').val(data.schoolId);
        });

        schoolBox.show(id);
    });

虽然每次show时都要传入当前元素的ID，但是肯定比每次click都先unbind全部，再重新bind要好。

[学校选择器v9 Demo](/demo/SchoolBox/v9/demo.html)



看起来是没错
-------------
像上面的应用层代码，在监听时判断的话，每个监听者元素被click时，都会重新去执行schoolBox的`on`方法，反复地生成同一个匿名的回调函数并绑定到同一个位置（`handlers[type][id]`）。显然上面的代码能够改成这样。

    var $source;

    var callback = function(data){
        $source.siblings('.school-input').val(data.schoolName);
        $source.siblings('.school-id').val(data.schoolId);
    };

    $('.choose-school').each(function(){
        // 监听自定义事件
        schoolBox.on('schoolChosen', $(this).attr('id'), callback);
    });

    $('.choose-school').click(function(){
        $source = $(this);
        schoolBox.show($source.attr('id'));
    });

引入了一个全局的`$source`变量去记录当前click的元素（以使回调中能够正确操作相应的元素），虽然这样很矬，但是至少避免了每次click时都去执行schoolBox的`on`方法，而且在循环中使用了`callback`函数的引用，避免了重复生成相同的匿名函数。总的来说，虽然长得丑，但是效率上是有提高的。

### 反思 ###

但是对于其中这小段代码

    $('.choose-school').each(function(){
        // 监听自定义事件
        schoolBox.on('schoolChosen', $(this).attr('id'), callback);
    });

我开始怀疑自己，*为什么在一个循环中反复去为不同的元素ID监听同一个事件类型，更可笑的是使用同一个回调函数？*于是我开始反思当初设计监听者回调函数的初衷。

最早在[一步步做组件-学校选择器(2)](/blog/2015/01/19/step-by-step-js-component-schoolbox-2#section-2)中我是这样使用回调的。

    var schoolBox = new SchoolBox({
        appendTo: '#schoolBoxWrapper',
        schoolClickCallback: function(){
            // 省略...
        }
    });

这样的缺点是，如果页面中有多个不同的元素都要对“学校选中”做出响应，那么这部分响应代码都得写在这个`schoolClickCallback`这里。如果需要响应的那些元素来自页面的不同区域，负责完全不同的功能，这样把响应代码都揉在一个地方的话，会造成一定的耦合。

所以出于这样的考虑，我想到使用观察者模式（即自定义事件），不同的元素各自监听自己需要的事件，自己维护自己如何响应。

    $('.choose-school').each(function(){
        // 监听自定义事件
        schoolBox.on('schoolChosen', $(this).attr('id'), callback);
    });

而这段代码似乎与这个初衷有点走歪路了，首先它们确实是不同的元素，但也是相似的元素，而它们监听的事件类型也相同，对事件响应的方式也相似。如此“强行”为不同的元素各自监听，是不是有点生搬硬套的意思了？



在回调时判断
-------------
我从[事件委托](/blog/2014/12/09/js-pattern-part7-browser-pattern#section-1)那里得到了启发，为何不为相似的元素统一监听一个事件，并且只有唯一一个回调函数。具体做法就是在`fire`事件时加入“由哪个元素触发”，以避免对所有元素都做出响应。

    SchoolBox.prototype = {
        on: function(type, handler){
            if(typeof this.handlers[type] === 'undefined'){
                this.handlers[type] = [];
            }
            this.handlers[type].push(handler);
        },
        fire: function(type, data){
            // 加入sourceId给回调参数
            if(this.curSourceId){
                data['sourceId'] = this.curSourceId;
            }

            if(this.handlers[type] instanceof Array){
                var handlers = this.handlers[type];
                for(var i=0, len=handlers.length; i<len; i++){
                    handlers[i](data);
                }
            }
        }
    };

这里对`on`不做改变，`this.handlers`还是原来的`{ eventType1: [ function(){} ]}`格式。在`fire`内部，在handlers回调前，把当前的`this.curSourceId`（当前打开SchoolBox的触发元素ID）也塞到回调参数data中。

这里同样要为SchoolBox的`show`和`hide`方法里加入`curSourceId`的判断，代码同[从监听上入手](#section-1)。

然后应用层具体的回调函数中只需要加入对`sourceId`的判断。

    // 监听自定义事件
    schoolBox.on('schoolChosen', function(data){
        if(data.sourceId){
            var $source = $('#' + data.sourceId);
            $source.siblings('.school-input').val(data.schoolName);
            $source.siblings('.school-id').val(data.schoolId);
        }
    });

    $('.choose-school').click(function(event){
        schoolBox.show($(this).attr('id'));
    });

在回调时找到“打开SchoolBox”的触发元素，然后只对相应的元素做出响应。正如事件委托比“为所有子元素都绑定事件”要好一样，这里“在回调时判断”也比“在监听时判断”效率要高。

[学校选择器v10 Demo](/demo/SchoolBox/v10/demo.html)



写在最后
----------
这个系列的文章从第1篇到现在第8篇，前后跨度2个半月，而最早在项目中做这部分功能已经是半年前了。经过这段反复审视代码和写博客的过程，自己得到了不少的提高，把以前看书看别人博客所记下的一堆零碎的知识融合了起来。也正是这个项目和这个博客，在我找实习面试的时候帮我加了很多分。

我会继续坚持走下去，回头看看走过的路和踩过的坑。谢谢~~（本系列完结）
