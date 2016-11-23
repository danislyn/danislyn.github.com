---
layout: post
title: "nodejs爬虫实现中遇到的坑"
category: node
tags: [nodejs]
---
{% include JB/setup %}

记录一些具体代码debug时遇到的问题（未完待续）

<!-- break -->

异步控制流
----------

涉及到的库

- [Q in Github](https://github.com/kriskowal/q) Promise化的一种实现，promise不是万能，改造复杂的动态决定的执行链是件比较吃力的事情
- [async](https://github.com/caolan/async) 点赞数很高的库，有人说有毒，我觉着很好用
- [eventproxy](https://github.com/JacksonTian/eventproxy) @朴灵的基于事件的流程控制，我觉着和promise或async搭配着使用很好用

要注意的点

- 避免 async 中间在 if-else 时多次调用`callback()`，建议都加上`return callback()`
- 整体串行，但其中某步中又有循环异步，建议内层用 async，整体用 eventproxy 去控制
- Promise 化方法改造



页面请求
---------

涉及到的库

- [superagent](http://visionmedia.github.io/superagent/) 处理请求的模块
- [request](https://github.com/request/request) 另一个处理请求的模块，比起 superagent，语法配置项更多一些。如果说 superagent 是 `$.post()`，那 request 就是 `$.ajax()`
- [cheerio](https://github.com/cheeriojs/cheerio) 用于DOM解析，提供与 jquery 选择器类似的接口


### 中文编码问题

当请求非 uft 编码的页面时，使用 superagent 请求后用 cheerio 解析，会发现取不到想要的中文字符。网上查了后知道有个叫 `iconv-lite` 的东西可以用来做转码，具体做法就对 superagent 扩展一个处理过程。

```
var superagent = require('superagent');
var Request = superagent.Request;
var iconv = require('iconv-lite');
var jschardet = require('jschardet');

/*
  superagent扩展: 使用iconv转码，统一转成 UTF-8
  用法: superagent.get(url).parse().end(...)
*/
Request.prototype.parse = function() {

  // set the parser
  this._parser = function(res, cb) { // res not instanceof http.IncomingMessage
    var buffers = [];

    res.on('data', function(chunk) {
      buffers.push(chunk);
    });

    res.on('end', function(err) {
      var text, err;
      try {
        var buf = Buffer.concat(buffers);
        var enc = jschardet.detect(buf).encoding;

        // 注：在服务器上安装 iconv 一直出错，在本地测试是可以用下面两行转码的
        // var converted = new (require('iconv').Iconv)(enc, 'UTF-8//TRANSLIT//IGNORE').convert(buf);
        // text = converted.toString();

        // 另一种做法：先用 iconv-lite 转
        text = iconv.decode(buf, enc);
        if(enc !== 'UTF-8'){
          buf = iconv.encode(text, 'UTF-8');
          text = iconv.decode(buf, 'UTF-8');
          // FUCK 好像存下来的html文件里还是带&#编码的
        }
      
      } catch (e) {
        err = e;
      } finally {
        res.text = text;
        cb(err);
      }
    });
  };

  return this;
};

module.exports = superagent;
```

然后使用 superagent 时就引用这个扩展模块的路径

```
var superagent = require('./extension/superagent-charset');

superagent.get(url)
    .set('User-Agent', Settings.USER_AGENT)
    .timeout(Settings.REQUEST_TIMEOUT)
    .parse()  // 编码统一转化 utf-8
    .end(function (err, res) {

    });
```


### 页面重定向问题

如果是在服务端的重定向，superagent 是可以捕捉到的，而且它本身就有对 `redirect()` 的配置接口。现在的问题是在浏览器端的重定向，我遇到过以下两种情况

1、通过设置 meta 标签来触发浏览器 refresh

例如：http://www.jscz.gov.cn，在首页设置了 `<meta http-equiv="Refresh" content="3;url=http://www.haishui.net">`

2、js脚本的页面跳转

例如：http://www.jsrm.gov.cn，在首页有一行脚本 `self.location="/?WebShieldSessionVerify=HtUMyhjlcREk8TaXCDHa"`

以上的页面跳转都发生在首页，会导致 superagent 抓来的页面内容是空的，除了去判断类似的代码模式，然后重新请求新的地址，暂时也没想出智能的办法。。。



数据库读写
---------

### 事务rollback

TBD

### 数据库同步write问题

TBD



内存错误
--------

### process out of memory

```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - process out of memory
```

### call stack size exceeded

```
RangeError: Maximum call stack size exceeded
```



其他错误
--------

### double callback!

TBD

### ECONNRESET

```
events.js:85
    throw er; // Unhandled 'error' event
        ^
    Error: read ECONNRESET
        at exports._errnoException (util.js:746:11)
        at TCP.onread (net.js:561:26)
```

