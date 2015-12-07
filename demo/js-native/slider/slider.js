(function(exports){
    // 常用方法，原生js的实现
    var Util = {
        merge: function(){
            var obj = {};
            var args = Array.prototype.slice.call(arguments);
            for(var i=0, len=args.length; i<len; i++){
                for(var k in args[i]){
                    if(args[i].hasOwnProperty(k) && !obj.hasOwnProperty(k)){
                        obj[k] = args[i][k];
                    }
                }
            }
            return obj;
        },
        $: function(selector){
            // 暂不考虑这里的标准兼容性
            return document.querySelector(selector);
        },
        wrapInner: function($el, className){
            var $inner = document.createElement('div');
            $inner.className = className;
            $inner.innerHTML = $el.innerHTML;
            $el.innerHTML = $inner.outerHTML;
        },
        addListener: function($el, eventType, handler){
            if(document.addEventListener){
                $el.addEventListener(eventType, handler);
            }
            else if(document.attachEvent){
                $el.attachEvent(eventType, handler);
            }
            else{
                $el['on' + eventType] = handler;
            }
        }
    };

    // 轮播切换的动画效果
    var Animation = {
        'display': {
            show: function($el){
                $el.style.display = '';
            },
            hide: function($el){
                $el.style.display = 'none';
            }
        },
        'opacity': {
            show: function($el, time){
                $el.style.opacity = 1;
                $el.style.transitionProperty = 'opacity';
                $el.style.transitionDuration = time + 'ms';
            },
            hide: function($el, time){
                $el.style.opacity = 0;
                $el.style.transitionProperty = 'opacity';
                $el.style.transitionDuration = time + 'ms';
            }
        }
    };

    // 轮播Class
    var Slider = function(config){
        // default config
        this.config = Util.merge(config, {
            itemClass: '.item',     // 轮播切换的子元素
            autoPlay: true,         // 自动开始动画，默认为true
            mode: 'opacity',        // 支持'display'和'opacity'，默认为'opacity'效果
            speed: 1000,            // 每页停留时间
            transitionTime: 300     // 动画过渡时间
        });

        this.$el = typeof this.config.el === 'string' ? Util.$(this.config.el) : this.config.el;
        this.itemNum = this.$el.childElementCount;
        this._init();

        if(this.config.autoPlay){
            this.play();
        }
    };

    Slider.prototype = {
        _init: function(){
            if(this.config.mode !== 'display'){
                Util.wrapInner(this.$el, 'slider-inner');
            }

            if(this.config.mode === 'opacity'){
                this.$el.querySelector('.slider-inner').style.position = 'relative';
                var $children = this.$el.querySelectorAll(this.config.itemClass);
                // 全部绝对定位
                for(var i=0, len=$children.length; i<len; i++){
                    $children[i].style.position = 'absolute';
                    $children[i].style.opacity = i==0 ? 1 : 0;
                }
            }

            this._bindEvents();
        },
        _bindEvents: function(){
            var self = this;

            Util.addListener(this.$el, 'mouseenter', function(){
                self.stop();
            });
            Util.addListener(this.$el, 'mouseleave', function(){
                self.play();
            });
        },
        _next: function(){
            this.currentIndex++;
            if(this.currentIndex >= this.itemNum){
                this.currentIndex = 0;
            }

            var $children = this.$el.querySelectorAll(this.config.itemClass);
            for(var i=0, len=$children.length; i<len; i++){
                if(i == this.currentIndex){
                    Animation[this.config.mode].show($children[i], this.config.transitionTime);
                }
                else{
                    Animation[this.config.mode].hide($children[i], this.config.transitionTime);
                }
            }
        },
        play: function(){
            if(typeof this.currentIndex === 'undefined'){
                this.currentIndex = 0;
            }
            var next = this._next.bind(this);
            this.timer = setInterval(next, this.config.speed);
        },
        stop: function(){
            if(this.timer){
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        jumpTo: function(index){
            this.currentIndex = index-1;
            this._next();
        }
    };

    // 导出模块变量
    exports.Slider = Slider;

})(window);