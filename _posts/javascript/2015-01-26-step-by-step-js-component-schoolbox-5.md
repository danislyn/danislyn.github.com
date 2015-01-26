---
layout: post
title: "一步步做组件-学校选择器(5)"
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

上一篇中我们简单实现了搜索框的功能，这节中要为它添加按键事件，“上”“下”键选择匹配的结果，“回车”键来进入下一步，以使它使用起来更加人性化。

<!-- break -->

键盘事件入口
-------------
在搜索框`keyup`事件那里，针对特殊的按键做拦截（不触发搜索）。

    var initSearchSchool = function(instance){
        // 以上省略...

        // 事件
        $searchInput.bind('keyup', function(event){
            // 特殊按键（动作键）
            if(event.keyCode == KEY_ENTER){
                searchSchoolChosen($searchList);
                return preventDefault(event);
            }
            if(event.keyCode == KEY_UP){
                searchListScrollPrev($searchDiv, $searchList);
                return preventDefault(event);
            }
            if(event.keyCode == KEY_DOWN){
                searchListScrollNext($searchDiv, $searchList);
                return preventDefault(event);
            }

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

这里定义了几个按键`keyCode`的全局变量和一个阻止浏览器默认事件的方法，如下。

    // Constants
    var KEY_ENTER = 13;
    var KEY_UP = 38;
    var KEY_DOWN = 40;

    // Utils
    var preventDefault = function(event){
        if(event && event.preventDefault)
            event.preventDefault();
        else
            window.event.returnValue = false;
        return false;
    };

这里用自己写的`preventDefault`是为了能够兼容不同的浏览器，`event.preventDefault()`是标准浏览器提供的，而`window.event.returnValue = false`是IE下的写法。

`searchSchoolChosen`是选择当前项，`searchListScrollPrev`是选中上一项，而`searchListScrollNext`是选中下一项，我们将在后面详细讲。



动画效果
---------
有了上面的代码结构，接下来要做的就是为特殊按键添加效果，这里涉及到动画，又是一个蛋疼的话题。

<img src="/assets/captures/20150126_01.jpg" style="max-width:600px;">

画了一张示意图，`sDiv`是父元素`searchDiv`，`sList`就是元素`searchList`，而`target`就是`searchList`中具体选中的那个子元素。根据这幅图，我们有：

> Δoffset = tarTop - sDivTop + scrollTop

其中父元素`sDiv`上设置了`height`并且`overflow-y: scroll`，我们可以把`sDiv`视作一个窗口，只要保证`target`始终在这个窗口高度范围内即可。即随着我们按“上”“下”键，我们要保证目标子元素在这个视窗边界之内。

> scrollTop <= Δoffset <= scrollTop + sDiv.height


于是我们有了控制`searchDiv`滚动条动画的方法。

    var searchListScroll = function($searchDiv, $searchList){
        var scrollTop = $searchDiv.scrollTop();
        var viewMin = scrollTop;
        var viewMax = viewMin + $searchDiv.height();

        var $target = $searchList.children('li.active');
        var deltaOffset = $target.offset().top - $searchDiv.offset().top + scrollTop;

        // deltaOffset要在视窗范围里
        if(deltaOffset > viewMax){
            $searchDiv.animate({scrollTop: scrollTop + deltaOffset - viewMax}, 'fast');
        }
        else if(deltaOffset < viewMin){
            $searchDiv.animate({scrollTop: scrollTop - (viewMin - deltaOffset)}, 'fast');
        }
    };


大体看上去没有问题，但是注意到当向“下”选中时，其实是`Δoffset + target.height`要在视窗范围内。因此我们作如下修正。

    var searchListScroll = function(isDown, $searchDiv, $searchList){
        // 以上省略...

        var deltaOffset = $target.offset().top - $searchDiv.offset().top + scrollTop;
        isDown && (deltaOffset += $target.height());

        // 以下省略...
    };


有了这个滚动条动画的方法，上面提到的`searchListScrollPrev`和`searchListScrollNext`也就信手拈来了。

    var searchListScrollPrev = function($searchDiv, $searchList){
        var $cur = $searchList.children('li.active');
        $cur.removeClass && $cur.removeClass('active');

        if($cur.length == 0 || $cur.index() == 0){
            $searchList.children('li').last().addClass('active');
            searchListScroll(true, $searchDiv, $searchList);
        }
        else{
            $searchList.children('li').eq($cur.index() - 1).addClass('active');
            searchListScroll(false, $searchDiv, $searchList);
        }
    };

    var searchListScrollNext = function($searchDiv, $searchList){
        var $cur = $searchList.children('li.active');
        $cur.removeClass && $cur.removeClass('active');

        if($cur.length == 0 || $cur.index() == $searchList.children().length-1){
            $searchList.children('li').first().addClass('active');
            searchListScroll(false, $searchDiv, $searchList);
        }
        else{
            $searchList.children('li').eq($cur.index() + 1).addClass('active');
            searchListScroll(true, $searchDiv, $searchList);
        }
    };

这两个方法就是用来响应“上”“下”键，控制`searchList`当前选中的子元素，为之添加class，并保证选中的元素在`searchDiv`的可见范围内。

注意这里代码`$cur.removeClass && $cur.removeClass('active');`这样写是因为可能找不到`$cur`元素，那么`$cur.removeClass`就肯定是`false`了，就不会执行`$cur.removeClass('active')`了。

还有一点要注意的是，`$cur.index()`值的范围并不是`0 ~ length-1`，实际上值为`-1`时表示找不到元素，而超过`length-1`时又会从头开始找，即`$cur.index()`等于`length`时其实是第一个子元素。所以这里的代码中当`$cur.index() == $searchList.children().length-1`时要即时为第一个元素添加class，以保证`$cur.index()`的值范围在`0 ~ length-1`中。



锦上添花
---------
1.当通过“上”“下”键来选中时，我们已经为目标子元素添加了`active`的样式，那么这时如果鼠标再来捣乱该怎么办？我们只好再为鼠标添加`hover`效果，以抹去上下键的选中效果。

    var initSearchSchool = function(instance){
        // 以上省略...

        $searchList.find('li').live('mouseenter', function(){
            $searchList.find('li.active').removeClass('active');
            $(this).addClass('hover');
        }).live('mouseleave', function(){
            $searchList.find('li.hover').removeClass('hover');
        });

        // 以下省略...
    };


2.至于“回车”键的响应方法，我们用最简单的办法，相当于选中的子元素`click`一下。

    var searchSchoolChosen = function($searchList){
        // 转向click event
        $searchList.children('li.active').click();
    };


3.我们发现当我们输入关键字搜索时，其实每按一次键都执行了一次搜索和更新元素。而大多数情况下，我们输入一个关键字需要进行多次按键，比如搜索“江苏”，其实按键依次输入了“jiangsu”和最后拼音选择汉字的数字键或空格键。我们应该对此做些优化，以减少搜索执行，若使用Ajax搜索的话，可以减少很多次网络开销。

    var initSearchSchool = function(instance){
        // 以上省略...

        // when正常输入
        initSearchSchool.currentTime = (new Date()).getTime();
        // 持续快速输入时不触发搜索
        if(initSearchSchool.currentTime - initSearchSchool.lastKeypressTime > KEY_PRESS_INTERVAL){
            initSearchSchool.lastKeypressTime = initSearchSchool.currentTime;
            searchSchool(keywords, $searchDiv, $searchList, $searchEmpty);
        }

        // 以下省略...
    };

这里在全局定义常量`var KEY_PRESS_INTERVAL = 300;`毫秒即可。虽然不能面面俱到，但是已经可以减少大部分按键情况的执行开销了。

[学校选择器v6 Demo](/demo/SchoolBox/v6/demo.html)
