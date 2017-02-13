---
layout: post
title: "使用 git submodule 建立子项目依赖"
category: 开发
tags: [git]
---
{% include JB/setup %}

在使用 git 做项目时，也许会碰到一些组件需要独立出去，同时供多个项目使用，而不是在多个项目里拷贝两份组件的代码。如果公共的组件已经成熟了，可以发布到CDN上供多个项目去引用。但如果都在开发阶段，在多个项目里都要引用某个公共组件，这是就需要用到 git submodule 的功能了。

<!-- break -->

建立 Submodule
---------------

### 演示仓库

- 主项目：git@github.com:xxx/your-app.git
- 子项目：git@github.com:xxx/your-lib.git


在主项目 your-app 中使用`git submodule add 子项目地址 在主项目中的路径`

> git submodule add git@github.com:xxx/your-lib.git libs/your-lib

然后`git status`会发现如下

> new file:   .gitmodules
> new file:   your-lib

查看`.gitmodules`内容

```
[submodule "libs/your-lib"]
        path = libs/your-lib
        url = git@github.com:xxx/your-lib.git
```

需要commit，但这里子模块目录并不是以文件形式提交，注意下面出现的`160000`模式。 这是 Git 中的一种特殊模式，它本质上意味着你是将一次提交记作一项目录记录的，而非将它记录成一个子目录或者一个文件。

> create mode 100644 .gitmodules
> create mode 160000 libs/your-lib


更新 Submodule
---------------

我们先在 your-lib 里做了新的commit，但在主项目 your-app 中直接`git pull`并不能获取到子模块的最新更新。

**【注意】需要进到主项目中子模块的具体目录里再 git pull**

然后在主项目根目录下发现。。。

> modified:   your-lib (new commits)

在主项目中需要再次commit，以告诉HEAD当前的子模块指向哪个版本。在 git 的提交记录里能看到变化内容只是个commit标识

<img src="/assets/captures/20161021_sub_commit.png" style="max-width:800px">

Git 在主项目中记录了一个子模块的提交日志的指针，用于保存子模块的提交日志所处的位置，以保证无论子模块是否有新的提交，在任何一个地方克隆下顶级项目时，各个子模块的记录是一致的。避免因为所引用的子模块不一致导致的潜在问题。如果我们更新了子模块，我们需要把这个最近的记录提交到版本库中，以方便和其他人协同。


克隆主项目
----------

方法1：

```
git clone git@github.com:xxx/your-app.git
git submodule update --init --recursive
```

方法2：

```
git clone --recursive git@github.com:xxx/your-app.git
```

Submodule 开发协作
------------------

在主项目中添加了 submodule 作为子项目，其实进入到子项目中，它跟平常`git clone`下来的仓库没啥区别，同样可以在里面 commit, pull, push

如果需要将子项目回退到之前的版本，可以使用`git reset –hard commit_id`，即在主项目中不使用最新版本的子项目（**此时同样需在主项目中 add commit 1次，以更新 Subproject  的指针位置**）。[更多 git 工作流的协作>>](http://blog.csdn.net/wirelessqa/article/category/1522507)

<img src="/assets/captures/20161021_sub_rollback.png" style="max-width:800px">


删除 Submodule
---------------

在主项目中`git rm libs/your-lib/`删除子模块后，`.gitmodules`文件的内容也会相应移除

<img src="/assets/captures/20161021_sub_delete.png" style="max-width:800px">


更多参考
--------

- [Git 工具 - 子模块](https://git-scm.com/book/zh/v2/Git-工具-子模块)
