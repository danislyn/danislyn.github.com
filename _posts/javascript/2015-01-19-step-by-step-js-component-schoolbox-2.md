---
layout: post
title: "一步步做组件-学校选择器(2)"
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

在第一篇中我们已经实现了学校选择器的基本功能，但是当其他页面也需要同样的功能的时候，我们当然不希望大段的复制代码，我们希望能够降低js和页面的耦合，提供一种更简单的初始化和调用方式。

<!-- break -->

目标
------
我们希望在页面上只需要定义一个父元素，然后直接`new`一个选择器出来即可。

    var schoolBox = new SchoolBox({
        appendTo: '#schoolBoxWrapper'
    });

并且`SchoolBox`只暴露一些必要的供外使用的API，如`schoolBox.show()`、`schoolBox.hide()`等。



封装设计模式
--------------
为了实现“简单”的目标，我们需要先了解下“封装”。其实js提供了非常弱的语法能力，它是弱类型语言，没有class的概念，没有`public`和`private`，也没有函数重载。但另一方面，正是它的弱语法，它提供了更高的自由度，利用它本身的closure和prototype的机制，完全可以模拟出“类”和公有/私有属性。

    var Book = (function(){
        // 私有静态属性
        var numOfBooks = 0;

        // 私有静态方法
        function checkIsbn(isbn){

        }

        // 返回真正的构造函数
        return function(newIsbn, newTitle, newAuthor){
            // 私有属性
            var isbn, title, author;

            // 特权方法（每个实例都会有一个方法的备份）
            this.getIsbn = function(){
                return isbn;
            };
            this.setIsbn = function(newIsbn){
                if(!checkIsbn(newIsbn)){
                    throw new Error('Book: ISBN无效');
                }
                isbn = newIsbn;
            };

            // 执行构造
            numOfBooks++;
            if(numOfBooks > 50){
                throw new Error('Book: 最多创建50个实例');
            }

            this.setIsbn(newIsbn);
        }
    })();

    // 公有静态方法（类的静态方法）
    Book.convertToTitleCase = function(inputString){

    };

    // 公有非特权方法（每个实例的方法都指向同一个备份）
    Book.prototype = {
        display: function(){
           
        }
    };

特权方法能够访问私有属性和方法，但是必须声明在`this`中。任何不需要直接访问私有属性的方法都可以在`prototype`中声明。`prototype`中的方法可以通过访问特权方法来间接访问私有属性。只有那些需要直接访问私有成员的方法才应该被设计为特权方法，但是每个对象实例都会包含所有特权方法的新副本，容易占内存。



SchoolBox重构
--------------
根据上面的封装模式，我们先搭出`SchoolBox`的框子。

    (function($){

        var SchoolBox = (function(){

            // 元素copy
            // 省略...

            // 缓存
            var provinces = SCHOOL_LIST;

            // 私有静态方法
            // 省略...

            // 真正的构造函数
            return function(options){
                // 初始化特权属性
                // 初始化生成
                // 省略...
            };
        })();

        SchoolBox.prototype = {
            init: function(){
                
            },
            show: function(){
                
            },
            hide: function(){
                
            }
        };

        // export
        window.SchoolBox = SchoolBox;

    })(jQuery);


1.将目标元素和元素copy定义成私有静态属性

    var $schoolBoxCopy = $(
        '<div class="school-box">' + 
            '<div class="school-box-header">选择学校</div>' + 
            '<div class="school-box-provinces"></div>' + 
            '<div class="school-box-schools"></div>' + 
        '</div>');

    var $provinceCopy = $('<a href="javascript:void(0)" class="province-item"></a>');
    var $schoolCopy = $('<a href="javascript:void(0)" class="school-item"></a>');

    // 非实例化缓存
    var provinces = SCHOOL_LIST;


2.将初始化province和school定义成私有静态方法

    var getProvinceById = function(pid){
        for(var i=0; i<provinces.length; i++){
            // NOTE: 前置条件province id可以转成数字
            if(Number(provinces[i]['id']) == Number(pid)){
                return provinces[i];
            }
        }
        return undefined;
    };

    var initProvinces = function($provinceDiv){
        for(var i=0; i<provinces.length; i++){
            var province = provinces[i];
            var $province = $provinceCopy.clone();
            $province.attr('data-province', province['id'])
                        .text(province['name']);
            $provinceDiv.append($province);
        }
    };

    var initSchools = function($schoolDiv, provinceId){
        var province = getProvinceById(provinceId);
        if(typeof province !== 'undefined'){
            var schools = province['school'];
            $schoolDiv.empty();

            for(var i=0; i<schools.length; i++){
                var school = schools[i];
                var $school = $schoolCopy.clone();
                $school.attr('data-school', school['id'])
                        .text(school['name']);
                $schoolDiv.append($school);
            }
        }
        return false;
    };

    var onProvinceClick = function($provinceDiv, $schoolDiv, cache){
        cache.lastProvinceIndex = $(this).index();
        var pid = $(this).attr('data-province');

        if(cache.curProvince != pid){
            // set chosen
            $provinceDiv.find('a[data-province="' + cache.curProvince + '"]').removeClass('chosen');
            $provinceDiv.find('a[data-province="' + pid + '"]').addClass('chosen');
            // update
            cache.curProvince = pid;
            initSchools($schoolDiv, pid);
        }
        // 滚动条置顶
        $schoolDiv.scrollTop(0);
    };

注意这里与先前不一样的是，需要操作元素的方法中得把目标元素作为参数传进去，而实例化的缓存（当前选中的province）也需要作为对象指针传入。


3.初始化方法及构造函数

    var init = function(instance){
        // 生成元素
        var $parent = $(instance.opts.appendTo);
        var $el = $('<div class="school-box-wrapper"></div>');

        $el.append($schoolBoxCopy.clone());
        $parent.append($el);

        // 初始化学校
        // NOTE: 这里不能用$el来find（否则live click将失效）
        var $provinceDiv = $parent.find('.school-box-provinces');
        var $schoolDiv = $parent.find('.school-box-schools');

        initProvinces($provinceDiv);

        // 事件
        $provinceDiv.find('a').click(function(event){
            onProvinceClick.apply(this, [$provinceDiv, $schoolDiv, instance.cache]);
        });

        // 释放变量
        // NOTE: $provinceDiv和$schoolDiv不能释放，在事件中还用到
        $schoolBox = null;
        $parent = null;
        $el = null;
    };

    // 真正的构造函数
    return function(options){
        // 默认配置
        this.opts = $.extend({
            appendTo: 'body'
        }, options);

        // 实例化的缓存
        this.cache = {
            curProvince: -1,
            lastProvinceIndex: 0  //最后一次点击的index，用于初始化选中
        };

        // 初始化生成
        init(this);
    };


4.在`prototype`中添加对外API

    SchoolBox.prototype = {
        show: function(){
            $(this.opts.appendTo).find('.school-box-wrapper').slideDown();
        },
        hide: function(){
            $(this.opts.appendTo).find('.school-box-wrapper').slideUp();
        }
    };


5.添加学校`click`事件的外部回调，将这个回调放在构造函数的`options`中

    var init = function(instance){
        // 以上省略...

        $schoolDiv.find('a').live('click', function(event){
            // 配置里定义的事件回调
            if(instance.opts.schoolClickCallback){
                instance.opts.schoolClickCallback.apply(this, []);
            }
            // 自动收起
            instance.hide();
        });

        // 以下省略...
    };


6.点缀下，初始化`SchoolBox`时默认选中第一个province，并对外提供`init`方法

    var SchoolBox = (function(){
        // 以上省略...

        // 真正的构造函数
        return function(options){
            // 以上省略...

            // 初始化生成
            init(this);
            this.init();
        };
    })();

    SchoolBox.prototype.init = function(){
        $(this.opts.appendTo).find('.school-box-provinces').find('a').first().click();
    };


7.应用层调用

    // 目标元素
    var $schoolInput = $('#schoolInput');
    var $schoolId = $('#schoolId');
    var $chooseBoxLink = $('#openSchoolBoxLink');

    // 实例化对象
    var schoolBox = new SchoolBox({
        appendTo: '#schoolBoxWrapper',
        schoolClickCallback: function(){
            // NOTE: 这里被调用时this指向事件触发的元素
            $schoolInput.val($(this).text());
            $schoolId.val($(this).attr('data-school'));
            // 动画
            $chooseBoxLink.show();
        }
    });

    // bind event
    $chooseBoxLink.click(function(){
        schoolBox.show();
        $(this).hide();
    });

[学校选择器v3 Demo](/demo/SchoolBox/v3/demo.html)



到此为止？
----------
到这里我们已经将学校选择器的基本功能封装成了一个“类”，具体页面使用时，只需要定义它被包裹的父元素，可以直接`new`一个对象出来，并在构造时的配置变量里定义事件回调。虽然大体上实现了本文一开始的目标，但是仅仅实现了基本的级联功能，而且只能定义一个事件回调。如果页面有多个元素都需要根据选中的学校进行一些改变，那么这些代码都得写在`schoolClickCallback`中，这部分代码可能操作着来自页面不同部分的元素（甚至是其他组件），这样就会造成一些耦合。
