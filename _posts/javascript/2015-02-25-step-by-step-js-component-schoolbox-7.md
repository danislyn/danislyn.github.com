---
layout: post
title: "一步步做组件-学校选择器(7)"
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

本来这个系列主题已经结束了，突然想到还有个功能要做，就是“模态”，即把学校选择器做成一个类似模态的对话框。这样就可以应付这样的使用场景：在一个学生列表的页面中，可以修改任意学生的所在学校，也可以添加其他学校的学生。

<!-- break -->

模态对话框
------------
经常看到“模态”这个词，特地百度了一下它的定义：

> 模态对话框（Modal Dialogue Box，又叫做模式对话框），是指在用户想要对对话框以外的应用程序进行操作时，必须首先对该对话框进行响应。如单击【确定】或【取消】按钮等将该对话框关闭。


再看看[Bootstrap v2](http://v2.bootcss.com/javascript.html#modals)提供的模态对话框

<img src="/assets/captures/20150225_01.jpg" style="max-width:100%;">

可以看到其实没什么，就是页面背景加一块**遮罩**（mask），然后添加一个对话框的关闭按钮，告诉用户一定要先对该对话框进行操作。



添加模态
-----------
首先从SchoolBox的对外接口出发，原来我们构造SchoolBox对象时会传入一个`appendTo`参数，意思是把这个对象追到到哪个元素中去。现在我们不用传`appendTo`了，就可以表示这是个模态框，不需要追加到哪个具体元素。


1.我们要做的就是在SchoolBox对外的`show`和`hide`方法做相应的改变。

    show: function(){
        if(this.opts.popup){
            $('body').append('<div class="school-box-mask"></div>');
            $(this.opts.appendTo).find('.school-box-wrapper')
                .removeClass('school-box-hide').addClass('school-box-popup');
        }
        else{
            $(this.opts.appendTo).find('.school-box-wrapper').slideDown();
        }
    },
    hide: function(){
        if(this.opts.popup){
            $('.school-box-mask').remove();
            $(this.opts.appendTo).find('.school-box-wrapper')
                .removeClass('school-box-popup').addClass('school-box-hide');
        }
        else{
            $(this.opts.appendTo).find('.school-box-wrapper').slideUp();
        }
    }

这里注意，当用户不传入`appendTo`时，构造函数中会给它个默认值就是`body`，即上面代码中的`$(this.opts.appendTo)`就是`$('body')`。


2.在初始化时添加模态框的窗口栏和关闭按钮。

    var $popupCloseCopy = $('<div class="school-box-popup-close"><a href="javascript:void(0)" title="关闭">X</a></div>');

    var init = function(instance){
        // 生成元素
        var $parent = $(instance.opts.appendTo);
        var $el = $('<div class="school-box-wrapper"></div>');

        $el.append($schoolBoxCopy.clone());
        $parent.append($el);

        // popup关闭
        if(instance.opts.popup){
            var $popup = $popupCloseCopy.clone();
            $el.prepend($popup);

            $popup.find('a').click(function(){
                instance.hide();
            });
        }

        // 以下省略...
    };


3.为模态框和遮罩添加相应的样式。

    .school-box-mask{
        background-color: #666;
        height: 100%;
        left: 0;
        opacity: 0.3;
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 99;
    }
    .school-box-popup{
        margin-left: -25%;
        left: 50%;
        position: fixed;
        top: 120px;
        z-index: 100;
    }
    .school-box-popup-close{
        background-color: #444;
        height: 24px;
        opacity: 0.8;
        padding: 2px 6px;
    }
    .school-box-popup-close a{
        float: right;
        font-family: Arial;
        font-size: 20px;
        font-weight: bold;
        line-height: 24px;
        color: #ddd;
        text-decoration: none;
    }
    .school-box-popup-close a:hover{
        color: #fff;
    }
    .school-box-hide{
        display: none;
    }


4.【patch】在真正的构造函数中添加`appendTo`的默认值，并添加`this.opts.popup`。在prototype的`init`中如果是`popup`，先隐藏`school-box-wrapper`，因为它直接append到body最后。



对象共享
---------
到这里我们已经实现了模态的SchoolBox，但是还有个问题，因为SchoolBox的构造开销不小，我们不希望在页面中每个有“学校”的地方都为之创建一个SchoolBox对象，我们希望同一个页面中能共用同一个SchoolBox对象。

因为我们之前已经使用了观察者模式，页面中的元素去监听自定义事件，然而“学校选定”这件事只触发一个事件。因此如果页面中有多个元素都监听着`schoolChosen`事件，那么当由一个元素打开的学校选择器操作完成后，所有监听着该事件的其他元素都会做出相应的改变。即在一个学生列表的页面中，我改变一个学生的学校，其他学生的学校也会跟着改变。

因此要实现共用一个对象，我们得在每次使用它时，清空它的监听者列表，并重新赋予它该次使用时唯一的回调函数。这样就可以实现操作一个学生的学校，只响应一个元素。

    SchoolBox.prototype.unbind = function(type){
        this.handlers[type] = [];
        return this;
    };



完整应用
----------
多个需要使用学校的元素

    <div id="formResult">
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
    </div>

共用一个SchoolBox对象，为页面元素绑定事件。

    $('.choose-school').click(function(){
        var $schoolInput = $(this).siblings('.school-input');
        var $schoolId = $(this).siblings('.school-id');

        // 监听自定义事件
        schoolBox.unbind('schoolChosen').on('schoolChosen', function(data){
            $schoolInput.val(data.schoolName);
            $schoolId.val(data.schoolId);
        });

        schoolBox.show();
    });


[学校选择器v8 Demo](/demo/SchoolBox/v8/demo.html)