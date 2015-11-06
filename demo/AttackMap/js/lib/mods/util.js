define(['jquery', 'underscore'], function($, U){
    return {
        /* 移动动画
            @param el {HTMLElement}
            @param x1 {number}
            @param y1 {number}
            @param x2 {number}
            @param y2 {number}
            @param config {Object}
                @param duration {number}
                @param ease {string}
                @param isShowEl {boolean} 动画结束后是否继续显示元素
                @param isClear {boolean} 动画结束后是否清除动画属性
                @param beforeAnim {Function}
                @param afterAnim {Function}
        */
        moveAnim: function(el, x1, y1, x2, y2, config) {
            if(!el){
                return;
            }
            if(!el.tagName && el.length){
                // jquery节点
                el = el[0];
            }

            var style = el.style;
            config = U.extend({
                duration: 400,
                ease: 'ease',
                isShowEl: true,
                isClear: false
            }, config);

            style.display = 'block';
            style.transform = 'translate3d(' + x1 + 'px, ' + y1 + 'px, 0px)';
            style.transitionDuration = '0ms';
            style.webkitTransform = 'translate3d(' + x1 + 'px, ' + y1 + 'px, 0px)';
            style.webkitTransitionDuration = '0ms';

            // before animation
            config.beforeAnim && config.beforeAnim();

            setTimeout(function() {
                style.transform = 'translate3d(' + x2 + 'px, ' + y2 + 'px, 0px)';
                style.transitionDuration = config.duration + 'ms';
                style.transitionTimingFunction = config.ease;
                style.webkitTransform = 'translate3d(' + x2 + 'px, ' + y2 + 'px, 0px)';
                style.webkitTransitionDuration = config.duration + 'ms';
                style.webkitTransitionTimingFunction = config.ease;

                // 下面不会有第二次setTimeout
                if(config.isShowEl && !config.isClear){
                    // after animation
                    config.afterAnim && config.afterAnim();
                }
            }, 0);

            // 动画结束后不显示元素
            if(!config.isShowEl){
                style.display = 'none';
            }
            // 清空动画属性（下次show时显示在最初的位置）
            if(!config.isShowEl || config.isClear){
                var that = this;
                setTimeout(function() {
                    that._clearTransform(el);
                    // after animation
                    config.afterAnim && config.afterAnim();
                }, config.duration + 10);
            }
        },

        _clearTransform: function(el){
            var style = el.style;
            style.transform = null;
            style.transitionDuration = null;
            style.transitionTimingFunction = null;
            style.webkitTransform = null;
            style.webkitTransitionDuration = null;
            style.webkitTransitionTimingFunction = null;
        },

        // jquery extends
        extend: function(){
  
            //目标对象  
            var target = arguments[0] || {},      
              
            //循环变量,它会在循环时指向需要复制的第一个对象的位置,默认为1  
            //如果需要进行深度复制,则它指向的位置为2  
            i = 1,      
              
            //实参长度  
            length = arguments.length,      
              
            //是否进行深度拷贝  
            //深度拷贝情况下,会对对象更深层次的属性对象进行合并和覆盖  
            deep = false,      
              
            //用于在复制时记录参数对象  
            options,      
              
            //用于在复制时记录对象属性名  
            name,      
              
            //用于在复制时记录目标对象的属性值  
            src,      
              
            //用于在复制时记录参数对象的属性值  
            copy;  
              
            //只有当第一个实参为true时,即需要进行深度拷贝时,执行以下分支  
            if (typeof target === "boolean") {  
                //deep = true,进行深度拷贝  
                deep = target;  
                  
                //进行深度拷贝时目标对象为第二个实参,如果没有则默认为空对象  
                target = arguments[1] || {};  
                  
                //因为有了deep深度复制参数,因此i指向的位置为第二个参数  
                i = 2;  
            }  
              
            //当目标对象不是一个Object且不是一个Function时(函数也是对象,因此使用jQuery.isFunction进行检查)  
            if (typeof target !== "object" && !jQuery.isFunction(target)) {  
                  
                //设置目标为空对象  
                target = {};  
            }  
              
            //如果当前参数中只包含一个{Object}  
            //如 $.extend({Object}) 或 $.extend({Boolean}, {Object})  
            //则将该对象中的属性拷贝到当前jQuery对象或实例中  
            //此情况下deep深度复制仍然有效  
            if (length === i) {  
                  
                //target = this;这句代码是整个extend函数的核心  
                //在这里目标对象被更改,这里的this指向调用者  
                //在 $.extend()方式中表示jQuery对象本身  
                //在 $.fn.extend()方式中表示jQuery函数所构造的对象(即jQuery类的实例)  
                target = this;  
                  
                //自减1,便于在后面的拷贝循环中,可以指向需要复制的对象  
                --i;  
            }  
              
            //循环实参,循环从第1个参数开始,如果是深度复制,则从第2个参数开始  
            for (; i < length; i++) {  
                  
                //当前参数不为null,undefined,0,false,空字符串时  
                //options表示当前参数对象  
                if ((options = arguments[i]) != null) {  
                      
                    //遍历当前参数对象的属性,属性名记录到name  
                    for (name in options) {  
                          
                        //src用于记录目标对象中的当前属性值  
                        src = target[name];  
                          
                        //copy用于记录参数对象中的当前属性值  
                        copy = options[name];  
                          
                        //存在目标对象本身的引用,构成死循环,结束此次遍历  
                        if (target === copy) {  
                            continue;  
                        }  
                          
                        //如果需要进行深度拷贝,且copy类型为对象或数组  
                        if (deep && copy && (jQuery.isPlainObject(copy) || jQuery.isArray(copy))) {  
                          
                            //如果src类型为对象或数组,则clone记录src  
                            //否则colne记录与copy类型一致的空值(空数组或空对象)  
                            var clone = src && (jQuery.isPlainObject(src) || jQuery.isArray(src)) ? src : jQuery.isArray(copy) ? [] : {};  
                              
                            //对copy迭代深度复制  
                            target[name] = jQuery.extend(deep, clone, copy);  
                              
                            //如果不需要进行深度拷贝  
                        } else if (copy !== undefined) {  
                              
                            //直接将copy复制给目标对象  
                            target[name] = copy;  
                        }  
                    }  
                }  
            }  
              
            //返回处理后的目标对象  
            return target;  
        }
    }
});