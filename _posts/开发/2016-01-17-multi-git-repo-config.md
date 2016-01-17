---
layout: post
title: "多仓库git配置"
description: ""
category: 
tags: []
published: false
---
{% include JB/setup %}

问题来源
--------


git通用配置
-----------

	ssh-keygen -t rsa -C "your_email@example.com"


	git clone git@your_git_repo.git
	cd your_git_repo
	touch README.md
	git add README.md
	git commit -m "add README"
	git push -u origin master


	cd existing_folder
	git init
	git remote add origin git@your_git_repo.git
	git add .
	git commit
	git push -u origin master


多仓库user配置
-------------

	git config --global user.name "Your Name"
	git config --global user.email "your_email@example.com"


	git config --list
	
