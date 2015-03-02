// ================================
// 自定义添加条目数目
// ================================
// 用法 demo
// <div id="parentDiv">
//     <div class="children-item">
//         <!-- label元素以及input select等 -->
//     </div>
// </div>
// 
// $('#parentDiv').myCustomAppend({
//     addLink: '#yourAddItemLink',
//     numLabel: 'label',      // parentDiv的每个children中如何找到label
//                             // 即$('#parentDiv').children().find(numLabel)
//     numText: 'alphabet',    // label格式 'alphabet'或'number' optional (default='number')
//     maxNum: 10,             // 最大条目数 optional (default=10) 
//     minNum: 2,              // 最小条目数 optional (default=1)
//     initNum: 2              // 初始条目数 optional (default=children数)
// });

(function($){

    $.fn.jqItemAppend = function(options){
        var CLASS_REMOVE_LINK = 'jqItemAppend-remove-link';
        var TEXT_REMOVE = '删除';

        var initChildrenNum = this.children().length;
        var $removeCopy = $('<a href="javascript:void(0)" class="' + CLASS_REMOVE_LINK + '">' + TEXT_REMOVE + '</a>');


        var opts = $.extend({
            numText: 'number',
            maxNum: 10,
            minNum: 1,
            initNum: initChildrenNum
        }, options);

        // storage: 数目状态
        var curNum;


        var getNextLabel = function($el){
            var temp = $el.find(opts.numLabel).last().text();
            var curLabel = temp.split('.')[0];

            // 字母序
            if(opts.numText === 'alphabet'){
                return String.fromCharCode(curLabel.charCodeAt(0) + 1) + '.';
            }
            // 数字序
            else if(opts.numText === 'number'){
                return (Number(curLabel) + 1) + '.';
            }
            // 无序号
            else{
                return '';
            }
        };

        var initItemInput = function($item){
            $item.find('input[type="text"]').each(function(){
                $(this).val('');
            });
            // TODO: select, checkbox, radio, textarea
            $item.find('input[type="checkbox"]').each(function(){
                $(this).removeAttr('checked');
            });
        };


        var addChildren = function($el){
            if(curNum >= opts.maxNum){
                jAlert('最多添加' + opts.maxNum + '项', '提示');
                return false;
            }

            var $copy = $el.children().last().clone();
            var label = getNextLabel($el);
            initItemInput($copy);

            // 添加removeLink
            if(curNum >= opts.minNum && $copy.find('.' + CLASS_REMOVE_LINK).length == 0){
                $copy.append($removeCopy);
            }

            $el.append($copy);
            $el.find(opts.numLabel).last().text(label);
            curNum++;
        };

        var removeChildren = function($el, $item){
            var removeIndex = $item.index();
            var $childrens = $el.children();

            // label逐个交换
            for(var i=curNum-1; i>=removeIndex+1; i--){
                $childrens.eq(i).find(opts.numLabel).text(
                    $childrens.eq(i-1).find(opts.numLabel).text());
            }

            $item.remove();
            curNum--;
        };


        var init = function($el){
            var childrenNum = $el.children().length;
            // 保持数量一致
            if(childrenNum < opts.initNum){
                // TODO: addChildren补齐
            }
            if(childrenNum > opts.initNum){
                // TODO: removeChildren一致
            }
            
            // 数目状态
            curNum = opts.initNum;

            // 添加removeLink
            $el.children().each(function(i){
                if(i+1 > opts.minNum){
                    $(this).append($removeCopy.clone());
                }
            });

            // removeLink绑定
            $el.find('.' + CLASS_REMOVE_LINK).live('click', function(){
                removeChildren($el, $(this).parent());
            });

            // addLink绑定
            $(opts.addLink).unbind('click').bind('click', function(){
                addChildren($el);
            });
        };


        // NOTE: throw Error会阻止其他js执行
        if(this.children().length == 0){
            // throw new Error('No custom item template to append.');
        }
        else if(!opts.addLink){
            // throw new Error('No trigger element.');
        }
        else{
            return init(this);
        }
    };

})(jQuery);