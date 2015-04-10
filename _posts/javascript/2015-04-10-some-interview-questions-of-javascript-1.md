---
layout: post
title: "几道JS面试题-基础篇"
category: javascript
tags: [javascript, 面试]
---
{% include JB/setup %}

拖了好久的文章，都是快一个月前的事了，都是电话面试的，最近的腾讯笔试居然都没过，不开心。。。避免拖延症，还是想把之前整理的和想到的赶紧写下来。

<!-- break -->

判断数组
----------
我答：

- 不能使用`typeof`判断，因为 typeof arr == 'object'

- instanceof arr == Array

- arr.constructor == Array

后来查资料还有一种

- Object.prototype.toString.call(arr) == '[object Array]'


引申：既然判断数组，如果判断数字呢？

- typeof num == 'number'

- isNaN(num) == false

注意：不能用`NaN`判断，因为`NaN !== NaN`



undefined与null的区别
-----------------------
- undefined表示值缺失，未定义

- null表示有值了，只不过值就是null，常用于清理内存

还有更奇怪的

    typeof null             // 'object'
    typeof undefined        // 'undefined'
    Number(null)            // 0
    Number(undefined)       // NaN



一段小程序
------------
有如下数据格式

    var data = [{
        "id": 1,
        "province": "江苏",
        "city": "南京"
    }, {
        "id": 2,
        "province": "江苏",
        "city": "镇江"
    }, {
        "id": 3,
        "province": "江苏",
        "city": "南京"
    }, {
        "id": 4,
        "province": "安徽",
        "city": "合肥"
    }];

这里我把数据简化了，它其实表示的是一家家店的所在位置，当然同一个城市可能会有多家分店。现在要写段程序，从上面的数据中提取出省份和城市，如下格式输出。

    [{
        "text": "江苏",
        "value": "江苏",
        "children": [
            {
                "text": "南京",
                "value": "南京"
            },
            {
                "text": "镇江",
                "value": "镇江"
            }
        ]
    }, {
        "text": "安徽",
        "value": "安徽",
        "children": [
            {
                "text": "合肥",
                "value": "合肥"
            }
        ]
    }]

它就是想从一个包含重复省市的数组中去提取去重后的省市级联关系（父子关系），于是我首先想到用map，JS中就是`{}`

    var provinceMap = {};
    var tempProv;
    var tempCity;

    // 遍历，用map去重
    for(var i=0, len=data.length; i<len; i++){
        tempProv = data[i]['province'];
        tempCity = data[i]['city'];

        if(typeof provinceMap[tempProv] === 'undefined'){
            provinceMap[tempProv] = {};
        }
        provinceMap[tempProv][tempCity] = tempCity;
    }

    var result = [];

    // map转成array
    for(tempProv in provinceMap){
        var cities = [];
        for(tempCity in provinceMap[tempProv]){
            cities.push({
                text: tempCity,
                value: tempCity
            });
        }

        result.push({
            text: tempProv,
            value: tempProv,
            children: cities
        });
    }

    console.log(result);

这里`provinceMap`中每个province又是一个map，里面我用city名做key，比起用数组还得每次去重，这算比较偷懒的写法，把工作交给了编译器。

然后被问：还有别的去重办法吗？

提示：用字符串

还是用上面的`provinceMap`，不过每个province key对应的是一个字符串，像`南京 镇江`用特定符号分隔。如此去重只要用`indexOf`判断即可。



小结
-------
这篇主要考的是JS中的基本数据类型，数值、布尔、字符串、null和undefined，除这5种外，其他都是对象，数组也是对象。JS面试中最重要的几点都是：作用域、原型、闭包，请看下一篇。
