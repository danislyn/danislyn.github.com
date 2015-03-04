---
layout: post
title: "自己写的jquery分页插件"
category: javascript
tags: [javascript, plugins]
---
{% include JB/setup %}

经常做信息管理类的网站，**分页**可以说是最常见的功能之一了。纵然网上可以找到一堆jquery分页插件，但我还是想手把手自己写一个分页，更清楚自己需要怎样的分页功能，不想包含过于复杂的功能。说到分页，我能想到3种：直接刷新页面；Ajax刷新分页；伪分页。伪分页其实就是对页面数据的过滤，页面包含了所有的数据的元素，只不过“一页”仅显示部分数据的元素。Ajax分页则是局部刷新页面上的数据元素。我先实现最简单的分页方式，即直接刷新页面。

<!-- break -->

jquery插件写法
----------------
jquery中提供了`fn`扩展属性，任何写到`fn`中的函数，都可以被jquery DOM元素直接调用。

    $.fn.sayHello = function(){
        return this.each(function(){
            alert(this);
        });
    };

有了这个扩展函数，可以直接对元素这样`$('#someElement').sayHello()`调用，也可以同时作用在多个元素上，像`$('.some-class').sayHello()`这样。

注意`sayHello`中两个`this`是有区别的，函数进来的第一个`this`就是指调用`sayHello()`的元素，而且这里的`this`就已经是jquery的元素了，不需要再多此一举`$(this)`了。而`this.each()`表示对所有调用`sayHello()`的元素均进行如下操作。`each(function(){})`里面的`this`表示的是单个调用`sayHello()`的元素，注意这里的`this`是原生DOM元素，如要使用jquery的函数，则需要先`$(this)`一下。

完善后的`sayHello`代码如下。

    $.fn.sayHello = function(){
        return this.each(function(){
            $(this).bind('click', function(){
                alert('hello ' + $(this).prop('tagName'));
            });
        });
    };

即这个sayHello插件会为元素绑定一个`click`事件，点击后会弹出该元素的标签名。效果如下。

<img src="/assets/captures/20150303_01.jpg" style="max-width:368px;">



分页插件设计
--------------
令这个分页插件（扩展函数）叫做`jqPagination`，我们希望它使用起来非常简单，在页面中只需要定义一个`<div>`，无需定义任何子元素，只需要`jqPagination()`一下，就会生成一个好看的分页按钮出来。由于页数是不确定的，不可能把所有页码在界面上都显示出来（体验太差），它只显示第一页、最后一页，以及当前页的前后两页。

<img src="/assets/captures/20150303_02.jpg" style="max-width:364px;">

可以看到，它有点类似一个“滑动窗口”，窗口大小是5（当前页和前后2页），未显示的页码用“...”显示。

由于在页面中只定义一个`<div>`，那么当前的页码和总页数

1. 要么写在`<div>`的自定义属性中

2. 要么当作参数传给`jqPagination`

这就是这个分页插件的对外接口设计。`<div>`中支持`data-pn`和`data-tpn`两个属性，分别表示当前页码和总页数。

    <div id="pagination1" data-pn="5" data-tpn="12"></div>

同时`jqPagination`也支持配置参数，如下。

    $('#pagination1').jqPagination({
        pn: 5,
        tpn: 12
    });



插件实现
----------
大体实现思路就是：

1. 为`<div>`添加一些子元素，不涉及具体页码。

2. 生成带“滑动窗口”的具体页码，并为页码添加是否active的样式。

3. 为每个页码添加链接，即点击该页则直接刷新页面。

4. 为“前一页”和“后一页”绑定点击事件。


**Step 1**

    $.fn.jqPagination = function(options){

        var generatePages = function($el){

            var $list = $('<ul class="' + CLASS_PAGE_LIST + '"></ul>');
            // prePage
            $list.append('<li class="' + CLASS_DISABLED + '"><a href="javascript:void(0);" class="' + CLASS_PRE_PAGE + '">' + TEXT_PRE_PAGE + '</a></li>');
            // firstPage
            $list.append('<li class="' + CLASS_ACTIVE + '"><a href="javascript:void(0);" class="' + CLASS_PAGE + '" data-page="1">1</a></li>');
            // preOmit
            $list.append('<li class="' + CLASS_DISABLED + '"><a href="javascript:void(0);" class="' + CLASS_PRE_OMIT + '">' + TEXT_OMIT + '</a></li>');
            // nextOmit
            $list.append('<li class="' + CLASS_DISABLED + '"><a href="javascript:void(0);" class="' + CLASS_NEXT_OMIT + '">' + TEXT_OMIT + '</a></li>');
            // lastPage
            $list.append('<li class=""><a href="javascript:void(0);" class="' + CLASS_PAGE + '" data-page="">' + TEXT_EMPTY + '</a></li>');
            // nextPage
            $list.append('<li class="' + CLASS_DISABLED + '"><a href="javascript:void(0);" class="' + CLASS_NEXT_PAGE + '">' + TEXT_NEXT_PAGE + '</a></li>');
            // append to list
            $el.empty().append($list);

        };

        var init = function($el){
            $el.addClass(CLASS_PAGINATION);
            generatePages($el);
        };

        return init(this);
    };

这里直接为几个特殊的元素占好“坑”，分别是：上一页，第1页，滑动窗口向前的省略，滑动窗口向后的省略，最后一页（页码为空），下一页。具体的页码元素都是有`data-page`属性的，这里第一页和最后一页也属于具体页码。然后在Step 2中生成其他具体页码，并为这里占的“坑”设置active、disabled或hide。


**Step 2**

    var generatePages = function($el){
        // 以上省略...

        var $dummies = $list.children('li');
        var dummyLen = $dummies.length;

        // targets reference
        var $firstPage = $dummies.eq(1);
        var $lastPage = $dummies.eq(dummyLen-2);
        var $prePage = $dummies.first();  // eq(0)
        var $nextPage = $dummies.last();  // eq(dummyLen-1)
        var $preOmitted = $dummies.eq(2);
        var $nextOmitted = $dummies.eq(dummyLen-3);

        // a copy for dynamic page, initial
        var $pageCopy = $firstPage.clone().removeAttr('class');

        // page number region
        var pn = Number(opts.pn);
        var tpn = Number(opts.tpn);
        var lowerPn = Math.max(pn-2, 2);  // 第1页已写在html中
        var upperPn = Math.min(pn+2, tpn-1);  // 最后1页已写在html中

        // generate new specific pages（当前页的前后2页）
        for(var i=lowerPn; i<=upperPn; i++){
            var $newPage = $pageCopy.clone();
            $newPage.find('a').attr('data-page', i).text(i);
            $newPage.insertBefore($nextOmitted);
            // add current page flag
            i == pn && $newPage.addClass(CLASS_ACTIVE);
        }

        // check first page
        $firstPage.removeClass(CLASS_ACTIVE);
        pn == 1 && $firstPage.addClass(CLASS_ACTIVE);

        // check last page
        $lastPage.find('a').attr('data-page', tpn).text(tpn);
        $lastPage.removeClass(CLASS_ACTIVE);
        pn == tpn && $lastPage.addClass(CLASS_ACTIVE);

        // check if last page equals first page
        $lastPage.removeClass(CLASS_HIDE)
        tpn == 1 && $lastPage.addClass(CLASS_HIDE);

        // check Previous page
        $prePage.attr('class', CLASS_DISABLED);
        pn > 1 && $prePage.removeClass(CLASS_DISABLED);
        
        // check Next page
        $nextPage.attr('class', CLASS_DISABLED);
        pn < tpn && $nextPage.removeClass(CLASS_DISABLED);

        // check pre omitted
        $preOmitted.removeClass(CLASS_HIDE);
        lowerPn <= 2 && $preOmitted.addClass(CLASS_HIDE);

        // check next omitted
        $nextOmitted.removeClass(CLASS_HIDE);
        upperPn == tpn-1 && $nextOmitted.addClass(CLASS_HIDE);
    };

这里的滑动窗口的页码范围为`Math.max(pn-2, 2)`到`Math.min(pn+2, tpn-1)`，因为第1页和最后1页已经在Step 1中占好“坑”了。生成的具体页码即当前页的前后2页，添加好`data-page`属性，插入到“坑”的相应位置。然后就是根据`pn`（当前页码）和`tpn`（总页数）对那些“坑”进行可见性的检查，该disabled的和该hide的。


**Step 3 & 4**

    var bindPageEvents = function($el){
        // Previous page
        $el.find('.' + CLASS_PRE_PAGE).click(function(){
            if($(this).parent().hasClass(CLASS_DISABLED)){
                return false;
            }
            var $target = $el.find('li.' + CLASS_ACTIVE).prev();
            // omitted patch
            if($target.hasClass(CLASS_DISABLED)){
                $target = $target.prev();
                if($target.hasClass(CLASS_DISABLED)){
                    $target = $target.prev();
                }
            }
            targetClick($target);
        });

        // Next page
        $el.find('.' + CLASS_NEXT_PAGE).click(function(){
            if($(this).parent().hasClass(CLASS_DISABLED)){
                return false;
            }
            var $target = $el.find('li.' + CLASS_ACTIVE).next();
            // omitted patch
            if($target.hasClass(CLASS_DISABLED)){
                $target = $target.next();
                if($target.hasClass(CLASS_DISABLED)){
                    $target = $target.next();
                }
            }
            targetClick($target);
        });

        // specific pages
        $el.find('a.' + CLASS_PAGE).each(function(){
            $(this).attr('href', getPageHref($(this).attr('data-page')));
        });
    };

这里就是为具体页码和“前一页”“后一页”添加点击效果。每个具体页码都是个带有`href`属性的`<a>`标签，以直接刷新页面，这里有个`getPageHref`方法稍后描述。而点击“前一页”“后一页”实则是去找到相对于当前页的具体页码元素，然后调用`targetClick`去模拟点击，也在稍后描述。



配置参数
----------
除了前面提到的`pn`和`tpn`两个参数外，我们还需要添加两个参数。因为是直接刷新页面以获取新的分页数据，那url中肯定要有个参数表示页码，那么这个参数的key叫什么。我们提供一个默认的名字，就叫`page`，即url都长成这样`/some/to/?page=2`，当然这个参数的名字也可以自定义。还有就是，分页刷新页面默认就是当前的url，只不过`page`参数的值不同，这个url也可以自定义。

    $.fn.jqPagination = function(options){

        // default option values
        var opts = $.extend({
            'pn': this.attr('data-pn') || 1,
            'tpn': this.attr('data-tpn') || 1,
            'name': 'page'
        }, options);

        // default value of 'pageHref'
        var defaultHref = window.location.pathname + '?' + opts.name + '=';
        if(/\?(\w+)=/.test(window.location.href)){
            // 如果已经有参数
            defaultHref = window.location.href + 
                (eval('/' + opts.name + '=/').test(window.location.href) ? '' : '&' + opts.name + '=');
        }

        opts['pageHref'] = opts['pageHref'] || defaultHref;

        // 以下省略...
    };

由此，前面提到的`getPageHref`就是去替换url里的`page`参数的值。

    var getPageHref = function(pageNo){
        return opts.pageHref.replace(eval('/' + opts.name + '=\\d*/'), opts.name + '=' + pageNo);
    };

当然那个模拟点击页码的`targetClick`就是直接刷新`window.location.href`咯

    var targetClick = function($li){
        var $link = $li.find('a.' + CLASS_PAGE);
        if(!$link.hasClass(CLASS_ACTIVE) 
            && !$link.hasClass(CLASS_DISABLED) 
            && !$link.hasClass(CLASS_HIDE)){
            // 是否刷页面
            /^\/|((http|https|svn|ftp|file):\/\/)/.test($link.prop('href')) ? 
                (window.location.href = $link.prop('href')) : $link.click();
        }
    };



插件使用
----------
提供3种使用方式，最基本的就是

    <div id="pagination1" data-pn="5" data-tpn="12"></div>

    $('#pagination1').jqPagination();


要手动设置pn和tpn，以及分页参数名称，就像这样

    $('#pagination2').jqPagination({
        pn: 5,
        tpn: 12,
        name: 'p'
    });


要自定义分页url的就像这样

    $('#pagination3').jqPagination({
        pageHref: 'http://www.baidu.com?from=fuxiaode.cn&page='
    });


[完整Demo](/demo/Pagination/v1/demo.html)
