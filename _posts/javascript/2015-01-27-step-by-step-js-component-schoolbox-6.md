---
layout: post
title: "一步步做组件-学校选择器(6)"
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

前面一连5篇下来，学校选择器已经有模有样了。这篇算是狗尾续貂了，如果在选择器中搜不到想要的学校该怎么办？我们再添加一个辅助功能，就是添加自定义学校。

<!-- break -->

界面设计
---------
继续前面的设计风格，在学校选择器的底部添加如下一行。

<img src="/assets/captures/20150127_01.jpg" style="max-width:400px;">

同时在搜索结果列表的底部，当无匹配结果时，也添加如下一行。

<img src="/assets/captures/20150127_02.jpg" style="max-width:250px;">



扩展组件功能
-------------
1.在私有静态变量里添加元素copy

    var $addSchoolCopy = $(
        '<div class="add-school-wrapper">' + 
            '<a href="javascript:void(0)" class="add-school-link">没找到？添加学校</a>' + 
            '<div class="inline-block hide add-school-div">' + 
                '<input type="text" class="add-school-input"/>' + 
                '<input type="button" class="add-school-ok" value="确定"/>' + 
                '<input type="button" class="add-school-cancel" value="取消"/>' + 
            '</div>' + 
        '</div>');


2.初始化新的元素

    var initAddSchool = function(instance){
        // 生成元素
        var $el = $(instance.opts.appendTo).find('.school-box-wrapper');
        $el.append($addSchoolCopy.clone());
        $el.find('.search-school-empty').append('<a href="javascript:void(0)" class="add-school-link">添加学校</a>');
        
        // 释放变量
        $el = null;
    };


3.为新的目标元素绑定事件
    
    // 目标元素
    var $addSchoolLink = $el.find('.add-school-link');
    var $addSchoolDiv = $el.find('.add-school-div');
    var $addSchoolInput = $el.find('.add-school-input');
    var $addSchoolOk = $el.find('.add-school-ok');
    var $addSchoolCancel = $el.find('.add-school-cancel');

    // 事件
    $addSchoolLink.click(function(){
        $addSchoolDiv.removeClass('hide');
        $addSchoolInput.focus();
    });

    $addSchoolCancel.click(function(){
        $addSchoolDiv.addClass('hide');
    });

    $addSchoolOk.click(function(){
        var schoolName = $.trim($addSchoolInput.val());
        if(schoolName.length == 0){
            return false;
        }

        // TODO: ajax添加
        var newSchoolId = 'undefined';

        // 自定义事件回调
        instance.fire('schoolChosen', {
            schoolName: schoolName,
            schoolId: newSchoolId
        });
        // 自动收起
        instance.hide();
        // 清空输入内容
        $addSchoolInput.val('');
        $addSchoolDiv.addClass('hide');
    });

注意`$addSchoolOk`的`click`执行里，应该用Ajax向后台发送请求，将用户输入的学校名添加到数据库中去，最后将新加学校的ID返回给页面。而上面的代码直接写死一个`undefined`的学校ID，这里仅做demo。最后添加成功后，依然要触发自定义`schoolChosen`事件，好让应用层页面做出响应。


4.应用层使用组件时添加一项初始化参数

    var schoolBox = new SchoolBox({
        appendTo: '#schoolBoxWrapper',
        searchSchool: true,
        addSchool: true
    });

可以看到扩展组件功能时，对应用层页面代码的影响是很小的。只要不添加自定义事件的类型，应用层几乎不用改代码，因为它只关心选中的学校，并将它更新显示到页面上，而不需要关心这个学校到底是通过什么方式选来的。

[学校选择器v7 Demo](/demo/SchoolBox/v7/demo.html)



总结
-----
学校选择器这个系列到这里结束了，我最初在项目里只做了这里版本v2的样子。后来又提新需求，搜索学校和找不到学校，然后就直接在v2上迭代，仅仅是表单里的一行选择，就搞了近1000行代码。后来又来新需求，说其他页面也需要编辑学校，因此我才不得不拆出来写成复用形式，一劳永逸。在这个重构的过程中，我将阶段性的每一步都做成一个版本，最后整理成了这6篇文章。既是对我自己的总结提高，同时也想告诉大家，做前端的不仅仅实现页面功能，更多地应该以工程师的角度去思考问题，让代码质量更高更易维护。

这里的学校选择器当然还不够完美，还有可以改进的地方。比如我看到别人的搜索结果列表中可以按住“下”键，它就会一直向下依次选中，还有对搜索结果的排序等等。
