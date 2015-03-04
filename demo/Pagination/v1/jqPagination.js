// ================================
// 自定义分页
// ================================
// 用法
// <div id="xxxPagination" data-pn="1" data-tpn="10"></div>
// 
// $('#xxxPagination').myPagination();  // 默认使用元素属性里的pn和tpn；默认使用当前location.pathname
// $('#xxxPagination').myPagination({pn: 5, tpn: 12});  // 手动设置pn和tpn
// $('#xxxPagination').myPagination({pageHref: '/somepage?aa=xx&page='});  // 自定义分页path

(function($){

    $.fn.jqPagination = function(options){
        var CLASS_PAGINATION = 'jqPagination';
        var CLASS_PAGE_LIST = 'pages';
        var CLASS_PAGE = 'page';
        var CLASS_PRE_PAGE = 'pre-page';
        var CLASS_NEXT_PAGE = 'next-page';
        var CLASS_PRE_OMIT = 'pre-omit';
        var CLASS_NEXT_OMIT = 'next-omit';

        var CLASS_ACTIVE = 'active';
        var CLASS_DISABLED = 'disabled';
        var CLASS_HIDE = 'hide';

        var TEXT_PRE_PAGE = '&lt;';
        var TEXT_NEXT_PAGE = '&gt;';
        var TEXT_OMIT = '...';
        var TEXT_EMPTY = '&nbsp';


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


        // page link
        var getPageHref = function(pageNo){
            return opts.pageHref.replace(eval('/' + opts.name + '=\\d*/'), opts.name + '=' + pageNo);
        };

        // page click
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


        var generatePages = function($el){
            // ====================================
            // PART-1: initialize empty page list
            // ====================================
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


            // ======================================================
            // PART-2: generate specific pages with a sliding-window
            // ======================================================
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


        var init = function($el){
            $el.addClass(CLASS_PAGINATION);
            generatePages($el);
            bindPageEvents($el);
        };

        return init(this);
    };

})(jQuery);