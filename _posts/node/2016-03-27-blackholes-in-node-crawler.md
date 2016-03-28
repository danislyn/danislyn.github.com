---
layout: post
title: "blackholes in node crawler"
description: ""
category: node
tags: [nodejs]
published: false
---
{% include JB/setup %}


异步控制流

- 避免async中间在if-else时多次调用callback()，建议都加上`return callback()`
- 整体串行，但其中某步中又有循环异步，建议内层用async，整体用eventproxy去控制
- Promise化方法改造


事务rollback



数据库同步write问题



double callback!



process out of memory

	FATAL ERROR: CALL\_AND\_RETRY\_LAST Allocation failed - process out of memory



ECONNRESET

	events.js:85
		throw er; // Unhandled 'error' event
			^
		Error: read ECONNRESET
		    at exports._errnoException (util.js:746:11)
		    at TCP.onread (net.js:561:26)



RangeError: Maximum call stack size exceeded



