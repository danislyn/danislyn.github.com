---
layout: post
title: "一步步做组件-学校选择器(3)"
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

在上一篇中我们使用了封装的设计方法，实现了一个学校选择器的“类”，降低了页面中使用该功能的难度。但同时我们发现页面中需要的回调都得写在同一个地方，这使得随着页面功能的迭代，学校选择器的回调函数将变得越来越庞大。为了解决这个隐患，需要自定义事件，然后在页面中需要用到回调的地方改成监听事件。我们首先要了解下观察者模式。

<!-- break -->

观察者模式
-----------
在之前的[javascript设计模式](/blog/2014/11/30/js-pattern-part6-design-pattern#section-7)中有一个观察者模式的例子，在那个例子中的记录了事件类型、回调函数以及回调`context`。这里我们对其简化，暂不考虑回调函数的`context`。

1.由于需要在对象外部监听/订阅事件，我们在`SchoolBox`的`prototype`中添加两个方法。

    SchoolBox.prototype = {
        // 以上省略...

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

`on`是用于监听的，供对象外部（应用层）使用。而`fire`用于触发事件，在对象内部使用。`handlers`是用来存储事件类型和回调函数的一个map，它的key就是事件类型，而value是一个数组，数组里面就是监听该事件类型的所有回调函数。

2.这里的`handlers`需要在对象构造的时候初始化，在真正的构造函数里添加一行`this.handlers = {};`即可。

3.触发事件

    $schoolDiv.find('a').live('click', function(event){
        // 以上省略...

        // 自定义事件回调
        instance.fire('schoolChosen', {
            schoolId: $(this).attr('data-school'),
            schoolName: $(this).text()
        });
    });

4.应用层监听事件

    schoolBox.on('schoolChosen', function(data){
        $schoolInput.val(data.schoolName);
        $schoolId.val(data.schoolId);
        $chooseBoxLink.show();
    });

[学校选择器v4 Demo](/demo/SchoolBox/v4/demo.html)



还有吗？
--------
观察者模式也叫做自定义事件，现在`SchoolBox`内部可以触发各种事件，而在应用层页面各部分只需要选择监听它需要的事件即可，这样就解决了先前的`schoolClickCallback`过大的问题。

那么到这儿就结束了吗？在下一篇中我们会添加搜索框的功能。
