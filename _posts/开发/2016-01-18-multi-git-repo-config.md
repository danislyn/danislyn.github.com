---
layout: post
title: "多仓库git配置"
category: 开发
tags: [git]
---
{% include JB/setup %}

最早自己在github上写博客，然后实习的时候用公司内部的gitlab，回学校后实验室又要搞自己的gitlab，提交的时候发现提交信息还是以前公司的，于是恍然大悟，上github一看，果然都是这样。。。

<!-- break -->

<img src="/assets/captures/20160118_01.png" style="max-width:330px">

严重影响活跃度啊有木有 (╯‵□′)╯︵┻━┻   于是我研究了下git多仓库配置的原理（本文只介绍类Unix环境下的配置）


git通用配置
-----------

### 生成 ssh key

	ssh-keygen -t rsa -C "your_email@example.com"

会有提示，一路空格即可，会在 `~/.ssh/` 下生成 `id_rsa` 和 `id_rsa.pub` 两个文件，需要将公钥（即`id_rsa.pub`）的内容添加到 github/gitlab 的账户ssh key设置里。

	cat ~/.ssh/id_rsa.pub
	
结果为：`ssh-rsa AAAA省略几百个字符+yMS5Nl4F “your_email@example.com”` 可以看到末尾就是你的邮箱。如果这是你的gitlab账号，那就把它加到gitlab的ssh key setting里。但如果你又想用github，又不幸的是你github账号不是这个邮箱，那么sorry，你得重新把这个新的`id_rsa.pub`添加到account setting里。

注意，我这里的做法是一个home目录下，只保留一份 `id_rsa` 和 `id_rsa.pub`，不管有多少个gitlab，都要把当前机器上最新的公钥添加进去。网上还查到一种办法，[github/gitlab 管理多个ssh key](http://www.cnblogs.com/fanyong/p/3962455.html)，我觉得一个 ssh key 也能用了，就懒得折腾了。

### 新加仓库

如果你要从零开始搭一个project，并且把代码传到git上，就像下面这样，先去 github/gitlab 上建个仓库。

	git clone git@your_git_repo.git
	cd your_git_repo
	touch README.md
	git add README.md
	git commit -m "add README"
	git push -u origin master

### 已有仓库

如果你已经有project了，如果原来是用svn管理代码的，那需要先把 `.svn` 这样的目录删掉。这是svn自己生成的文件，用来比对更改的，其实文件挺大的，一般至少占project目录总大小的1/3

	find . -type d -name '.svn' | xargs rm -rf
	
上面命令的意思是：先(递归)找到当前路径下含有`.svn`的文件目录，再经`xargs`逐个删除。现在终于可以将project迁移到git了！

	cd your_project
	git init
	git remote add origin git@your_git_repo.git
	git add .
	git commit
	git push -u origin master


多仓库user配置
-------------
回到一开始那张图上的问题：我github上的提交信息是公司gitlab上的信息和邮箱，导致我活跃度丢了。。。

研究后发现是 git config 的问题，在公司实习的时候误用了下面两条命令

	git config --global user.name "Your Name"
	git config --global user.email "your_email@example.com"

`--global`选项是会覆盖全局的，就是说你在home下的任何目录不管使用 github 还是 gitlab，只要你用 git commit 提交，都会默认先取 global user 作为 contributor，可能会导致和你 github/gitlab 账号不符！

### 解决办法

1. 先确定自己哪个 github/gitlab 账号用的最多，把用的最多的号作为 global user （别忘了前提是`id_rsa.pub`都得添加到各平台上）

2. 假设我现在gitlab用的最多

		cd your_gitlab_repo
		git config --global user.name "Your Name"
		git config --global user.email "your_email@gitlab.com"
	
3. 然后要去github里改回github的账号，防止被当成其他contributor

		cd your_github_repo
		git config --local user.name "Your Name"
		git config --local user.email "your_email@github.com"

	注意这里用的是 `--local` 选项，不会覆盖全局，只在当前目录生效

4. 在github的仓库的里查看

		git config --list

	可以看到最上面是global user，最下面是重写的local user
	
		push.default=matching
		user.name=Global Name
		user.email=your_email@gitlab.com
		省略...
		remote.origin.url=git@your_github_repo.git
		branch.master.remote=origin
		branch.master.merge=refs/heads/master
		user.name=Local Name
		user.email=your_email@github.com

终于经过一番更改后，再看github，就恢复正常啦！

<img src="/assets/captures/20160118_02.png" style="max-width:270px">


gitignore
----------
最后再补充一点关于gitignore的配置，我觉得这个功能比svn好用多了！

	cd your_git_repo
	touch .gitignore

配置语法：

- 以斜杠 `/` 开头表示目录
- 以星号 `*` 通配多个字符
- 以问号 `?` 通配单个字符
- 以方括号 `[]` 包含单个字符的匹配列表
- 以叹号 `!` 表示不忽略(跟踪)匹配到的文件或目录

此外，git 对于`.gitignore`配置文件是按行从上到下进行规则匹配的，意味着如果前面的规则匹配的范围更大，则后面的规则将不会生效。


参考
----
[github/gitlab 管理多个ssh key](http://www.cnblogs.com/fanyong/p/3962455.html)
