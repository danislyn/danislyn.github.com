---
layout: post
title: "一步步做组件-学校选择器(1)"
description: ""
category: javascript
tags: [javascript, web组件]
---
{% include JB/setup %}

开篇
-----
这学期来一直在忙项目，整整一个学期都在做，自己的看书计划也没能实施。不过还是有不少收获的，是对以前看过的*JS Patterns*系列的综合运用，所以光看是不够的，一定要能应用到实际的业务中，并根据具体业务相应调整。趁着现在这段时间，想把以前写过的代码重新review一遍，并抽出可复用的功能把它们改写成通用组件，既是自己总结和提升的机会，也把它们作为以后的代码积累。

最近这个项目是做在线编程教育的，既然是教育，当然会跟学校挂钩，所以注册的时候就涉及到学校选择。我就从这里入手，讲述下如何一步步做成学校选择器的js组件。


界面设计
---------
由于本人设计能力拙劣，所以偷懒直接参考了[人人网](http://www.renren.com)里的学校选择器的画风。

<img src="/assets/captures/20150118_01.jpg" style="max-width:645px;">

我们这里只做了国内的高校，比人人网少一层，先从简，定义了下面的元素。

    <div class="school-box-wrapper">
        <div class="school-box">
            <div class="school-box-header">选择学校</div>
            <div class="school-box-provinces">
                <a href="javascript:void(0)" class="province-item" data-province="1">江苏</a>
            </div>
            <div class="school-box-schools">
                <a href="javascript:void(0)" class="school-item" data-school="10284">南京大学</a>
                <a href="javascript:void(0)" class="school-item" data-school="10286">东南大学</a>
            </div> 
        </div>
    </div>

我们这里的学校ID采用的是教育部标准的学校代码，而省份ID无实际含义。参照上面的图，写出了以下样式。

    .school-box-wrapper{
        margin: 10px 0;
    }
    .school-box{
        background-color: white;
        border: 1px solid #005EAC;
        width: 650px;
    }
    .school-box-header{
        background: #3777BC;
        color: white;
        font-size: 14px;
        font-weight: bold;
        padding: 5px 10px;
    }
    .school-box-provinces,
    .school-box-schools{
        border: 1px solid #C3C3C3;
        margin: 5px 10px 10px 10px;
    }
    .school-box-schools{
        height: 200px;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .school-box-provinces a,
    .school-box-schools a{
        color: #005EAC;
        cursor: pointer;
        display: inline-block;
        font-size: 12px;
        height: 18px;
        line-height: 18px;
        text-decoration: none;
    }
    .school-box-provinces a{
        margin: 2px 5px;
        padding: 1px;
    }
    .school-box-provinces a:hover{
        text-decoration: underline;
    }
    .school-box-provinces a.chosen{
        background-color: #005EAC;
        color: white;
    }
    .school-box-schools a{
        margin: 4px 12px;
        overflow: hidden;
        padding-left: 10px;
        width: 160px;
    }
    .school-box-schools a:hover{
        background-color: #005EAC;
        color: white;
    }

大体效果如图，依样画葫芦还凑合吧。

<img src="/assets/captures/20150118_02.jpg" style="max-width:671px;">

[学校选择器v1 Demo](/demo/SchoolBox/v1/demo.html)



学校数据存储
-------------
上面的demo中学校是hard code到元素中的，但实际上不可能这样做。我们需要定义school的数据格式。

    [
        {
            "id": 1,
            "name": "北京",
            "school": [
                {
                    "id": 10001,
                    "name": "北京大学"
                }
            ]
        }
    ]

于是我们将抓来的所有学校数据生成一个JSON对象放在全局中。[学校列表.js](/demo/SchoolBox/v2/school-list.js)



省份-学校 级联
---------------
待续

[学校选择器v2 Demo](/demo/SchoolBox/v2/demo.html)

