---
layout: post
title: "一步步做组件-学校选择器(4)"
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

在上一篇中我们用观察者模式实现了自定义事件的功能，让应用层的事件回调更加松耦合。但是到此为止学校选择器仅仅做了基本的省份和学校的级联功能，现在我们要为它添加搜索的功能。

<!-- break -->

界面设计
---------
依旧模仿[人人网](http://www.renren.com)的学校设计，它也有个动态搜索框，如图。

<img src="/assets/captures/20150125_01.jpg" style="max-width:631px;">

先依样画葫芦把元素和样式搞出来

    <div class="search-school-wrapper">
        <div class="inline-block"><label>搜索：</label></div>
        <div class="inline-block">
            <input type="text" class="search-school-input"/>
            <div class="search-school-div">
                <ul class="search-school-list"></ul>
                <div class="search-school-empty">
                    <span class="text-error">找不到该学校</span>
                </div>
            </div>
        </div>
    </div>

这里的元素最后都要搬到js中去生成，先写在html里为了调样式。

    .search-school-wrapper{
        float: right;
        font-size: 12px;
    }
    .search-school-input{
        padding: 2px 4px;
        width: 180px;
    }
    .search-school-div{
        background-color: #fff;
        border: 1px solid #C3C3C3;
        border-top: none;
        color: #005EAC;
        display: none;
        font-size: 12px;
        font-weight: normal;
        max-height: 200px;
        overflow-x: hidden;
        overflow-y: scroll;
        position: absolute;
        width: 188px;
    }
    .search-school-list li{
        cursor: pointer;
        height: 20px;
        line-height: 20px;
        padding-left: 5px;
    }
    .search-school-list li.active,
    .search-school-list li.hover,
    .search-school-list li:hover{
        background-color: #005EAC;
        color: white;
    }
    .search-school-empty{
        display: none;
        padding: 5px 0;
        text-align: center;
    }



如何搜索
---------
我们当然首先想到发送一个Ajax请求，然后后台去数据库模糊查询，最后返回一个学校列表的数据。甚至做的更好一些的话，可以定义关键词匹配度，然后根据这个值来调整返回的学校列表的顺序。

在之前的章节中，我们将一个很大的`SCHOOL_LIST`变量存在了js中，包含了后台数据库中的所有学校。这里我们继续这个思路，采用的是直接在js本地搜索。

    var reg = eval('/' + keywords.split('').join('\\S*') + '/');

这里`keywords`就是用户输入的text，我们用这样一个正则去匹配`SCHOOL_LIST`的学校名称，最后将一个列表刷新到页面元素上。



扩展组件功能
-------------
1.在私有静态变量里添加元素copy

    var $searchSchoolCopy = $('...省略...即上面那段html');


2.初始化新的元素

    var initSearchSchool = function(instance){
        // 生成元素
        var $el = $(instance.opts.appendTo).find('.school-box-wrapper');
        $el.find('.school-box-header').append($searchSchoolCopy.clone());

        // 释放变量
        $el = null;
    };

    var init = function(instance){
        // 以上省略...

        // 附加功能
        if(instance.opts.searchSchool){
            initSearchSchool(instance);
        }
    };


3.搜索学校的动态刷新

    var updateSearchList = function(schools, $searchDiv, $searchList, $searchEmpty){
        $searchEmpty.hide();
        $searchDiv.show();
        $searchList.empty();

        for(var i=0; i<schools.length; i++){
            $searchList.append('<li class="school-item" data-school="' + schools[i]['id'] + '">' + schools[i]['name'] + '</li>');
        }

        // no result hint
        if(schools.length == 0){
            $searchEmpty.show();
        }
    };

    var searchSchool = function(keywords, $searchDiv, $searchList, $searchEmpty){
        // 从provinces缓存里搜索
        var reg = eval('/' + keywords.split('').join('\\S*') + '/');
        var result = [];
        var schools = [];

        for(var key in provinces){
            schools = provinces[key]['school'];
            for(var i=0, len=schools.length; i<len; i++){
                if(reg.test(schools[i]['name'])){
                    result.push(schools[i]);
                }
            }
        }

        updateSearchList(result, $searchDiv, $searchList, $searchEmpty);
    };

这里采用与之前实现省份-学校级联功能类似的办法，由于这些方法写成了类的静态私有方法（因为我不想把它们暴露到类的外面，也不想让每个类的实例都存有该方法的备份），所以需要把具体实例涉及到的DOM元素作为参数传到这些方法中。


4.为搜索学校绑定事件

    var initSearchSchool = function(instance){
        // 生成元素
        // 省略...

        // 目标元素
        var $searchInput = $el.find('.search-school-input');
        var $searchDiv = $el.find('.search-school-div');
        var $searchList = $el.find('.search-school-list');
        var $searchEmpty = $el.find('.search-school-empty');

        // 事件
        $searchInput.bind('keyup', function(event){
            var keywords = $.trim($(this).val());
            // 空格or拼音没输完时暂不search
            if(keywords.length == 0 || keywords.indexOf("'") > -1){
                $searchDiv.hide();
                return false;
            }

            searchSchool(keywords, $searchDiv, $searchList, $searchEmpty);
        });

        // 以下省略...
    };


5.搜索框中选定学校，触发自定义事件（给类的外部）

    var initSearchSchool = function(instance){
        // 以上省略...

        // 选定学校
        $searchList.find('li').live('click', function(){
            // 配置里定义的事件回调
            if(instance.opts.schoolClickCallback){
                instance.opts.schoolClickCallback.apply(this, []);
            }
            // 自定义事件回调
            instance.fire('schoolChosen', {
                schoolId: $(this).attr('data-school'),
                schoolName: $(this).text()
            });
            // 自动收起
            instance.hide();
            // 清空搜索内容
            $searchInput.val('');
            $searchDiv.hide();
        });

        // 以下省略...
    };


6.应用层使用组件时添加一项初始化参数

    var schoolBox = new SchoolBox({
        appendTo: '#schoolBoxWrapper',
        searchSchool: true
    });

这里通过搜索框选择的学校触发的也是`schoolChosen`事件，所以对应用层来说是透明的。即应用层不需要知道该事件来自省份-学校级联，还是来自学校搜索框。

[学校选择器v5 Demo](/demo/SchoolBox/v5/demo.html)



精益求精
---------
虽然简单实现了搜索框的功能，其实只能算“过滤”，这个系列就要这样结束了吗？细心的同学会发现上面的demo搜索框出来的结果只能用鼠标点击，不支持键盘事件。而根据我们平时使用别人软件的习惯，经常是输入完关键字后按方向键选择匹配的项，然后直接按回车键进入下一步。我将在下一篇中来实现这个功能。
