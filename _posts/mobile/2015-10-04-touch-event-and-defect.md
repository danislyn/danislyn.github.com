---
layout: post
title: "也来说说touch事件与点击穿透问题"
category: mobile
tags: [mobile, javascript]
---
{% include JB/setup %}

做过移动端H5页面的同学肯定知道，移动端web的事件模型不同于PC页面的事件。看了一些关于touch事件的文章，我想再来回顾下touch事件的原理，为什么通过touch可以触发click事件，touch事件是不是万能的以及它可能存在的问题。

<!-- break -->

touch事件的来源
---------------
PC网页上的大部分操作都是用鼠标的，即响应的是鼠标事件，包括`mousedown`、`mouseup`、`mousemove`和`click`事件。一次点击行为，可被拆解成：`mousedown` -> `mouseup` -> `click` 三步。

手机上没有鼠标，所以就用触摸事件去实现类似的功能。touch事件包含`touchstart`、`touchmove`、`touchend`，注意手机上并没有`tap`事件。手指触发触摸事件的过程为：`touchstart` -> `touchmove` -> `touchend`。

手机上没有鼠标，但不代表手机不能响应mouse事件（其实是借助touch去触发mouse事件）。有人在PC和手机上对事件做了对比实验，以说明手机对touch事件相应速度快于mouse事件。

<img src="http://images.cnitblog.com/blog/294743/201310/19161138-7c39b72bc6c048738962c042d1df766f.png" style="max-width: 609px;">

可以看到在手机上，当我们手触碰屏幕时，要过300ms左右才会触发`mousedown`事件，所以`click`事件在手机上看起来就像慢半拍一样。

### touch事件中可以获取以下参数

| 参数 | 含义 |
|-----|-----|
| touches | 屏幕中每根手指信息列表 |
| targetTouches | 和touches类似，把同一节点的手指信息过滤掉 |
| changedTouches | 响应当前事件的每根手指的信息列表 |



tap是怎么来的
-------------
用过Zepto或KISSY等移动端js库的人肯定对`tap`事件不陌生，我们做PC页面时绑定`click`，相应地手机页面就绑定`tap`。但原生的touch事件本身是没有tap的，js库里提供的tap事件都是模拟出来的。

我们在上面看到，手机上响应 click 事件会有300ms的延迟，那么这300ms到底是干嘛了？浏览器在 touchend 后会等待约300ms，原因是判断用户是否有双击（double tap）行为。如果没有 tap 行为，则触发 click 事件，而双击过程中就不适合触发 click 事件了。由此可以看出 click 事件触发代表一轮触摸事件的结束。

既然说tap事件是模拟出来的，我们可以看下Zepto对 singleTap 事件的处理。[见源码 136-143 行](https://github.com/madrobby/zepto/blob/master/src/touch.js#L136-L143)，可以看出在 touchend 响应 250ms 无操作后，则触发singleTap。



点击穿透的场景
-------------
有了以上的基础，我们就可以理解为什么会出现*点击穿透*现象了。我们经常会看到“弹窗/浮层”这种东西，我做个了个demo。

<img src="/assets/captures/20151004_01.jpg" style="max-width: 313px;">

整个容器里有一个底层元素的div，和一个弹出层div，为了让弹出层有模态框的效果，我又加了一个遮罩层。

	<div class="container">
		<div id="underLayer">底层元素</div>

		<div id="popupLayer">
			<div class="layer-title">弹出层</div>
			<div class="layer-action">
				<button class="btn" id="closePopup">关闭</button>
			</div>
		</div>
	</div>
	<div id="bgMask"></div>

然后为底层元素绑定 click 事件，而弹出层的关闭按钮绑定 tap 事件。

	$('#closePopup').on('tap', function(e){
		$('#popupLayer').hide();
		$('#bgMask').hide();
	});

	$('#underLayer').on('click', function(){
		alert('underLayer clicked');
	});

点击关闭按钮，touchend首先触发tap，弹出层和遮罩就被隐藏了。touchend后继续等待300ms发现没有其他行为了，则继续触发click，由于这时弹出层已经消失，所以当前click事件的target就在底层元素上，于是就alert内容。整个事件触发过程为 touchend -> tap -> click。

而由于click事件的滞后性（300ms），在这300ms内上层元素隐藏或消失了，下层同样位置的DOM元素触发了click事件（如果是input框则会触发focus事件），看起来就像点击的target“穿透”到下层去了。

[完整demo](/demo/touch-event/problem.html)请用chrome手机模拟器查看，或直接扫描二维码在手机上查看。

<img src="/assets/captures/20151004_02.png" style="max-width: 173px;">


### 结合Zepto源码的解释

[zepto](https://github.com/madrobby/zepto/blob/master/src/touch.js)中的 tap 通过兼听绑定在 document 上的 touch 事件来完成 tap 事件的模拟的，是通过事件冒泡实现的。在点击完成时（touchstart / touchend）的 tap 事件需要冒泡到 document 上才会触发。而在冒泡到 document 之前，手指接触和离开屏幕（touchstart / touchend）是会触发 click 事件的。

因为 click 事件有延迟（大概是300ms，为了实现safari的双击事件的设计），所以在执行完 tap 事件之后，弹出层立马就隐藏了，此时 click 事件还在延迟的 300ms 之中。当 300ms 到来的时候，click 到的其实是隐藏元素下方的元素。

如果正下方的元素有绑定 click 事件，此时便会触发，如果没有绑定 click 事件的话就当没发生。如果正下方的是 input 输入框（或是 select / radio / checkbox），点击默认 focus 而弹出输入键盘，也就出现了上面的“点透”现象。



穿透的解决办法
-------------

### 1. 遮挡 ###

由于 click 事件的滞后性，在这段时间内原来点击的元素消失了，于是便“穿透”了。因此我们顺着这个思路就想到，可以给元素的消失做一个fade效果，类似jQuery里的`fadeOut`，并设置动画duration大于300ms，这样当延迟的 click 触发时，就不会“穿透”到下方的元素了。

同样的道理，不用延时动画，我们还可以动态地在触摸位置生成一个透明的元素，这样当上层元素消失而延迟的click来到时，它点击到的是那个透明的元素，也不会“穿透”到底下。在一定的timeout后再将生成的透明元素移除。[具体可见demo](/demo/touch-event/solution1.html)


### 2. pointer-events ###

`pointer-events`是CSS3中的属性，它有很多取值，有用的主要是`auto`和`none`，其他属性值为SVG服务。

| 取值 | 含义 |
|------|-----|
| auto | 效果和没有定义 pointer-events 属性相同，鼠标不会穿透当前层。 |
| none | 元素不再是鼠标事件的目标，鼠标不再监听当前层而去监听下面的层中的元素。但是如果它的子元素设置了pointer-events为其它值，比如auto，鼠标还是会监听这个子元素的。 |

关于使用 pointer-events 后的事件冒泡，有人做了个实验，[见代码](http://runjs.cn/code/teegz43u)

因此解决“穿透”的办法就很简单，[demo如下](/demo/touch-event/solution2.html)

	$('#closePopup').on('tap', function(e){
		$('#popupLayer').hide();
		$('#bgMask').hide();

		$('#underLayer').css('pointer-events', 'none');

		setTimeout(function(){
			$('#underLayer').css('pointer-events', 'auto');
		}, 400);
	});


### 3. fastclick ###

使用[fastclick](https://github.com/ftlabs/fastclick)库，其实现思路是，取消 click 事件（[参看源码 164-173 行](https://github.com/ftlabs/fastclick/blob/master/lib/fastclick.js#L164-L173)），用 touchend 模拟快速点击行为（[参看源码 521-610 行](https://github.com/ftlabs/fastclick/blob/master/lib/fastclick.js#L521-L610)）。

	FastClick.attach(document.body);

从此所有点击事件都使用`click`，不会出现“穿透”的问题，并且没有300ms的延迟。[解决穿透的demo](/demo/touch-event/solution3.html)

有人（叶小钗）对事件机制做了详细的剖析，循循善诱，并剖析了fastclick的源码以自己模拟事件的创建。[请看这篇文章，看完后一定会对移动端的事件有更深的了解](http://www.cnblogs.com/yexiaochai/p/3462657.html)



参考资料
--------
[手持设备点击响应速度，鼠标事件与touch事件的那些事](http://www.cnblogs.com/yexiaochai/p/3377900.html)

[点击穿透](http://liudong.me/web/touch-defect.html)

[fastclick](https://github.com/ftlabs/fastclick)

[彻底解决tap“点透”，提升移动端点击响应速度](http://www.cnblogs.com/yexiaochai/p/3442220.html)
