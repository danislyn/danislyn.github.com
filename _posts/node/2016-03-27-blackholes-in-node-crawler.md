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

