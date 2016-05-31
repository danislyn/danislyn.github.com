---
layout: post
title: "从零开始配置一台服务器"
category: 开发
tags: [linux]
---
{% include JB/setup %}

最近项目要迁移，以前是和其他项目共用一台服务器的，现在要迁移到独立服务器。本人linux用的比较晚，以前是win狗，苦于各种莫名错误，改用mac开发也才1年时间。第一次从零开始配置服务器，故记录以备忘。

<!-- break -->

服务器起步
----------

### Hello World

购买服务器，选好配置

- 40G系统盘，500G数据盘，正常项目够用了
- 内存和带宽看具体应用场景，4G内存带64位系统比较合适，PS.带宽很贵
- 操作系统我不太懂，听说CentOS比较稳定，目前阿里云上可选的版本有5.8、6.5、7.0。根据版本号`a.b.c`的规则，我一般不太愿意尝试`b`位版本号较低的版本，7.0肯定新特性多，但是问题也会存在。像5.8肯定维护的很稳定了，除非官方放弃维护。最后我权衡选择了6.5 =_=

使用root账号登录

> OK. Welcome to Elastic Compute Service!


### 创建用户

一直使用root登录是不合理不安全的，所以开始操作前先添加用户：

	useradd fuxiaode

新创建的用户home目录默认在`/home/fuxiaode`，而root用户的home目录在`/root`。然后为用户设置登录密码：

	passwd fuxiaode

可以在`/etc/passwd`文件中查看到刚才创建的用户：

	nscd:x:28:28:NSCD Daemon:/:/sbin/nologin
	fuxiaode:500:500::/home/fuxiaode:/bin/bash
	guest:x:501:501::/home/guest:/bin/bash

这里我创建了两个用户`fuxiaode`和`guest`，注意其末尾非`nologin`

下面为`fuxiaode`用户添加root权限：

- 打开`/etc/sudoers`
- 找到`Allow root to run any commands anywhere`这一行
- 添加`fuxiaode ALL=(ALL) ALL`


### 测试用户权限

切换到`guest`用户（上面未赋予其root权限）

	su guest
	sudo vim /etc/passwd

出现一段话

	We trust you have received the usual lecture from the local System
	Administrator. It usually boils down to these three things:
	
	    #1) Respect the privacy of others.
	    #2) Think before you type.
	    #3) With great power comes great responsibility.

	[sudo] password for guest: 

输完密码，然后并没鸟用，因为`guest`不在`/etc/sudoers`文件中！

切换`fuxiaode`用户，重新试下sudo，妥妥的！



基础环境
---------

### 包管理

系统中一般会自带一些开发包，但是经常需要升级到我们需要的版本。CentOS中使用`yum`来管理rpm包：

	sudo yum list

yum的具体使用命令详见 [http://blog.chinaunix.net/uid-346158-id-2131252.html](http://blog.chinaunix.net/uid-346158-id-2131252.html)


### python

CentOS 6.5自带的是Python 2.6.6，而编译llvm需要Python 2.7以上。而`yum`中最新的也是Python 2.6.6，只能下载Python 2.7.10的源代码自己编译安装。

首先要安装编译python需要的包，切换到root用户省的权限麻烦

	sudo su
	yum groupinstall "Development tools"
	yum install zlib-devel
	yum install bzip2-devel
	yum install openssl-devel
	yum install ncurses-devel
	yum install sqlite-devel

手动下载python

	wget http://python.org/ftp/python/2.7.10/Python-2.7.10.tar.xz
	tar -xf Python-2.7.10.tar.xz

编译和安装

	./configure --prefix=/usr/local
	make && make altinstall （需要sudo）

创建软链（`-b`表示覆盖之前的）

	ln -sb /usr/local/bin/python2.7 /usr/bin/python

查看版本

	which python
	python --version

至此成功！以上过程参考 [Installing python 2.7 on centos 6.3](https://github.com/h2oai/h2o-2/wiki/Installing-python-2.7-on-centos-6.3.-Follow-this-sequence-exactly-for-centos-machine-only)


### pip

Ubuntu下可以用`apt-get`很方便的安装

	apt-get install python
	apt-get install python-pip

但在`yum`中是不行的，试过安装easy_install后再装pip，但是我都莫名失败了。。。FUCK

现在使用源码安装

	wget https://pypi.python.org/packages/d3/16/21cf5dc6974280197e42d57bf7d372380562ec69aef9bb796b5e2dbbed6e/setuptools-20.10.1.tar.gz

	wget --no-check-certificate https://pypi.python.org/packages/41/27/9a8d24e1b55bd8c85e4d022da2922cb206f183e2d18fee4e320c9547e751/pip-8.1.1.tar.gz

然后在解压后的目录里依次使用python命令安装

	sudo python setup.py install

但是尼玛，这时试下pip会提示`sudo：pip：找不到命令`，这时因为前面安装python时我们设置装到了`/usr/local`下，安装的命令实际在`/usr/local/bin`下，因此这里需要同`python`一样建个软链。

	ln -s /usr/local/bin/pip /usr/bin/pip

现在果断可以使用pip了，查看已经安装过哪些python包

	pip list

可能会提示pip需要升级

	pip install --upgrade pip （需要sudo）


### nodejs

node不用`yum`或源码安装，node使用自己的`npm`进行包管理，推荐使用`nvm`安装。

	curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash

这条命令安装完后，会在home下生成`~/.nvm`目录，需要在`~/.bash_profile`中添加一行：
	
	source ~/.nvm/nvm.sh

然后使之生效

	source ~/.bash_profile

现在就可以使用`nvm`命令安装node版本了

	nvm install 0.12
	nvm alias default 0.12

同样也可以使用`npm`命令了

	npm install -g koa

通过npm全局安装的包会存在`~/.nvm/versions/node/v0.12.13/lib/node_modules`目录下。



数据库
------

### mongodb

安装

	wget http://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.6.11.tgz
	tar -xzf mongodb-linux-x86_64-2.6.11.tgz /var/lib/mongodb

创建数据库文件夹与日志文件（因为今后数据和日志会增长很快，最好放在另一块硬盘上）

	mkdir /mnt/lib/mongodb/data
	touch /mnt/lib/mongodb/logs

首次启动（无身份认证模式）

    /var/lib/mongodb$ mongod --dbpath=/var/lib/mongodb/data --logpath=/var/lib/mongodb/logs --logappend --port=27017 --fork

进入mongodb，设置用户和权限

	$ mongo
	> use admin
	> db.addUser('yourAdminUser', 'password')

关闭mongod服务

	> use admin
	> db.shutdownServer()
	> exit

再次启动（身份认证模式）

	/var/lib/mongodb$ mongod --dbpath=/var/lib/mongodb/data --logpath=/var/lib/mongodb/logs --logappend --auth --port=27017 --fork

进入mongodb，这时use database时需要认证

	use admin
	db.auth('yourAdminUser','password')

创建数据库，添加授权用户

	use yourDatabaseName
	db.addUser('databaseUser','password')

查看所有用户

	use admin
	db.system.users.find()
	
需要注意的是，mongod服务起来后，尽量不要用kill进程的方式来关闭服务，尽量使用如下方式来关闭

	use admin
	db.shutdownServer()
	
mongod也可以从配置文件启动（启动参数位于配置文件中）

	mongod --config /var/lib/mongodb/mongodb.conf

配置内容如下

	dbpath=/mnt/lib/mongodb/data
	logpath=/mnt/lib/mongodb/logs
	logappend=true
	auth=true
	port=27017
	fork=true


### mongodb journal

日志文件会持续增长，占用大量磁盘空间，如需关闭日志，可添加启动参数`--nojournal`。



TODO
-----
之后有空再记录mysql的安装、nginx项目部署，以及脚本构建方面的内容。

