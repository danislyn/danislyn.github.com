---
layout: post
title: "mooctest项目总结"
category: 开发
tags: [泛型编程, Testing]
---
{% include JB/setup %}

[慕测平台](http://mooctest.net)（简称mooctest），这个项目致力于编程类考试和练习的服务平台，教师可以轻松监管考试流程，学生可以自由练习编程。系统负责编程练习的自动化评估及可视化展现，配合当下红火的MOOC慕课课程，慕测平台将是学生自学编程的好帮手。目前已支持的编程类型有：Java覆盖测试，Java测试驱动编程，Python统计编程，C++编程，Jmeter性能测试，以及Android应用测试。之所以叫“mooctest”是因为“测试”是我们的主打产品，其中Java覆盖测试、Java Debug分析，以及Android应用测试是我们的核心服务。我们帮助高校的教“软件测试”的老师便捷地组织在线考试，帮助高校的学生接触到工业界真实的app案例，以提高学生的testing能力。

<!-- break -->

项目概况
--------
- [mooctest](http://mooctest.net)于2014.8月下旬开始启动项目，最初开发者只有2位
- 2014.11月，完成考试管理平台的基础建设，以及Java覆盖测试的客户端，开始第一轮内测
- 2014.12月，参加项目原型展示，收集第二轮内测
- 2015.1月，添加对Java覆盖测试的考题分析功能
- 2015.3月，正式上线，与网易云课堂合作，开设[《概率论与数理统计》](http://mooc.study.163.com/course/NJU-1000031001#/info)慕课课程，由[mooctest](http://mooctest.net)系统提供“Python统计编程”练习
- 2015.5月，项目扩张，不断添加新科目，Java测试驱动编程，Jmeter性能测试，以及Android应用测试也有了雏形
- 2015.7月，Android应用测试独立成[Kikbug系统](http://kikbug.net)，完成和[mooctest](http://mooctest.net)系统的对接
- 2015.9月，Android应用测试与“阿里”达成合作，获得企业内测的真实app
- 2015.10月，正式在南京大学、东南大学、南京邮电大学、南通大学、大连理工等重点高校试点，作为其“软件测试”课程的白盒测试（以Java覆盖测试为例）和黑盒测试（以Android应用测试为例）的练习和考试平台
- 2015.11月，再次与网易云课堂合作，开设[《开发者测试》](http://mooc.study.163.com/course/NJU-1000112002#/info)微专业课程，由[mooctest](http://mooctest.net)系统提供“Java覆盖测试”和“Debug调试”的练习
- 2015.12月，联合“阿里云测”以及[TesterHome](https://testerhome.com)举办[阿里云测找 bug 大赛](https://testerhome.com/topics/3873)，圆满落幕！
- 截至目前，[mooctest](http://mooctest.net)平台上已有近1万名学生和400名老师，来自全国各地500多个高校！


项目结构
--------
我作为“码农”，还是来说说我更擅长的事，总结下这个项目的技术选型以及组织结构，以便为今后的项目作参考。

整体上我们就采用了基于Java的[Play Framework 1.2.7](https://www.playframework.com/documentation/1.2.x/home)的版本，之后出的`2.0.x`以上的版本是基于SCALA的，和`1.x.x`完全不是一个东西。而Play框架对“从Java学起的软院学生”来说非常友好，比起 Struts 和 Spring 省去了很多繁琐的xml配置和Annotation配置。综合学习成本和项目定位，Play框架是性价比很高的选择。


### 目录结构

后台部分

- lib/ 存放各种外部jar包
- conf/ Play框架配置文件的目录
	- application.conf 项目系统设置：debug设置、session设置、server设置、数据库设置等，也可存放自定义的系统级变量设置
	- routes 路由(url)配置
	- messages.en 多语言支持的字典文件(英文)
	- messages.zh_CN 多语言支持的字典文件(中文)
- app/ Play里叫这个，相当于普通project里的src目录
	- common/ 存放一些项目中用到的定义的常量或枚举量
		- Constants.java 通用常量
		- ExamType.java 某个自定义类型的常量
	- controllers/ MVC中的控制器层，以角色名开头，命名区分；注：只负责request和resonpse，不负责具体业务逻辑
		- AdmAccountController.java 管理员角色的Account模块
		- TeaExamController.java 教师角色的Exam模块
		- StuExamController.java 学生角色的Exam模块
	- managers/ 具体业务逻辑的包装，供controller调用
		- admin/ 供管理员角色的
		- student/ 供学生角色的
		- teacher/ 供教师角色的
		- application/ 供系统通用的
		- interfaces/ 供对外API的
	- models/ 与数据库对应的Model，用来做ORM(Object Relational Mapping)
	- dao/ 封装对数据库model的原子操作，其中每个具体model的DAO类都继承GenericDao
		- GenericDao.java 泛型DAO，提供通用的增删改查操作
		- ExamDao.java 具体的跟Exam相关的DAO
	- data.structure/ 跟前台交互约定的非数据库model的数据类型
		- Pagination.java 跟分页相关的数据类型
		- WrappedExam.java 对Exam结果的包装，方便前台交互
	- utils/ helper方法
		- application/ 跟应用相关的util
			- DataUtil.java 跟应用和模块相关的数据结构转换方法
			- ParamUtil.java 负责处理request的参数转换方法
			- ResponseUtil.java 负责对response结果的转换方法
			- SessionUtil.java 封装对session的操作和转换方法
			- VcodeUtil.java 封装对验证码的操作方法
		- data/ 跟通用数据相关的util
			- EncryptionUtil.java 加解密处理的转换方法
			- ExcelUtil.java 封装对excel格式转换的方法
		- file/ 跟文件操作相关的util
		- mail/ 跟收发邮件相关的util
	- jobs/ 定时任务相关
	- extensions/ 对页面模板语法的扩展
	- views/ 前台页面模板，见下面

前台部分

- app/views/
	- Base/ 页面继承的父页面模板
		- base_outer.html 不需要登录的页面父模板
		- base_inner.html 需要登录的页面父模板
		- base_admin.html 管理员角色的页面父模板，继承自base_inner.html
		- base_teacher.html 教师角色的页面父模板，继承自base_inner.html
	- Application/ 存放不需要登录的页面
	- class、exam、exercise 等具体功能包的页面
	- tags/ 自定义页面标签的模板，相当于需要被include的页面子块
		- examView.html 管理员和教师都需要用到此页面块，供复用
		- passwordView.html 个人资料页面和忘记密码页面都需要用到此页面块
- public/ 存放前端资源的目录
	- css/
		- common/ 存放应用所有页面通用的css
		- bootstrap/ 主题库相关
		- jquery-ui/ 主题库相关
		- tablesorter/ 插件相关
		- others/ 其他小插件的css
		- class、exam 等具体功能包的css
	- file/ 存放页面上供下载的静态文件
	- svg/ 存放编程题目源程序控制流图的svg文件
	- images/ 存放css的图片
		- bootstrap/ 主题库相关的图片
		- jquery-ui/ 主题库相关的图片
		- others/ 其他小插件的图片
	- js/
		- common/ 存放页面通用的js，或者可复用的js
		- bootstrap/ 主题库的js
		- jquery-ui/ 主题库的js
		- tablesorter/ 插件的js
		- others/ 其他小插件的js
		- class、exam 等具体功能包的js


数据库与ORM
-----------
本系统中使用 MySQL 数据库，Play框架中使用JPA提供ORM(Object Relational Mapping)的功能。

一个简单的Model类定义如下

	import javax.persistence.*;
	import play.db.jpa.Model;

	@Entity
	@Table(name="exam")
	public class Exam extends Model {
		
		@Column(name="exam_name")
		private String examName;
		
		@ManyToOne
		@JoinColumn(name="tea_id", referencedColumnName="id")
		private Teacher teacher;
		
		public String getExamName() {
			return examName;
		}
		public void setExamName(String examName) {
			this.examName = examName;
		}
		public Teacher getTeacher() {
			return teacher;
		}
		public void setTeacher(Teacher teacher) {
			this.teacher = teacher;
		}
	}

也是通过简单的Annotation来配置数据库字段和成员变量的对应关系，以及一对多/多对多的关系。注意，这里不需要给`Exam`添加额外的`id`字段了，因为在`Model`父类中已经由JPA自带了`id`字段，格式为`Long`，所以数据库表里定义id字段时要注意设置“自增”和`int(32)`。


DAO事务与泛型编程
----------------
如上面定义了`Exam`类后，该Model就被注入了JPA提供的增删改查操作了，为了防止职责乱用，我们统一约定由DAO层来封装数据库事务。这样`Exam`就会有个`ExamDao`，`Teacher`就会有个`TeacherDao`，我们会发现简单的增删改查对所有Model都适用的，为了避免简单操作方法的重复，我们引入“泛型Dao”的概念。

我在以前的文章中写过关于[JPA泛型DAO](/blog/2015/02/01/generic-dao-for-jpa)，需要定义一个泛型的`GenericDao`类，提供通用的增删改查操作。

	public abstract class GenericDao<T, PK extends Serializable> {
		
		private Class<T> clazz;
		
		public GenericDao(){
			// 反射获取T.class，实参类型
			clazz = (Class<T>)((ParameterizedType)getClass().getGenericSuperclass()).getActualTypeArguments()[0];
		}
		
		public T findById(PK id){
			return (T) JPA.em().find(clazz, id);
		}
		
		public List<T> findByColumn(String columnName , Object value){
			String[] columnNames = new String[1];
			Object[] values = new Object[1];
			
			columnNames[0] = columnName;
			values[0] = value;
			
			return findByColumns(columnNames , values);
		}
		
		public List<T> findByColumns(String[] columnNames , Object[] value){
			String sqlPart = "";
			for (int columnIdx = 0 ; columnIdx < columnNames.length ; columnIdx++){
				sqlPart += "e." + columnNames[columnIdx] + " = '" + value[columnIdx].toString() + "'";
				if (columnIdx < columnNames.length - 1){
					sqlPart += " and ";
				}
			}
			
			return (List<T>) JPA.em().createQuery("select e from " + clazz.getName() + " e where " + sqlPart).getResultList();
		}
	}

而具体Model都有具体的Dao去继承它

	public class ExamDao extends GenericDao<Exam, Long> {
		
		public Exam findByTeaIdAndExamName(long teaId, String examName) {
			String[] columns = {"teacher.id" , "examName"};
			Object[] values = {teaId , examName};
			List<Exam> list = this.findByColumns(columns, values);
			
			if (list != null && list.size() > 0){
				return list.get(0);
			}
			return null;
		}

		public List<Exam> findByTeaOpenid(String teaOpenid) {
			return this.findByColumn("teacher.teaOpenid", teaOpenid);
		}
	}

关于`GenericDao`的更多细节请看[JPA泛型DAO](/blog/2015/02/01/generic-dao-for-jpa)


后端MVC框架
-----------
从上面的项目结构中已经看到，后端调用层次结构为 `Controller`->`Manager`->`Dao`->`Model`，`Controller`最终拿到`Model`数据传给前端页面，可见这是伪MVC。更准确来说是“分层”结构：上层可以调用下层，下层不能调用上层；同时上层也不能跨层调用。

我们这里说框架的MVC，更着重于`Controller`怎么和页面`View`挂钩起来，并不太涉及`Model`的事，这里就需要路由(url)配置。

### route配置规范

	# 非登录的页面
	GET		/										Application.index
	GET		/faq/{category}/{sub}					Application.{category}{sub}FAQ

	# 登录和注册
	POST	/login									LoginController.login

	# 角色的功能模块
	*		/tea/{action}							TeacherController.{action}
	*       /tea/exam/{action}            			TeaExamController.{action}

	# Map static resources from the /app/public folder to the /public path
	GET     /public/                                staticDir:public

路由配置支持定义请求方式`GET` or `POST`，也可以使用通配符，注意对于“更改”操作一定要使用`POST`，这是http的规范。url和`Controller`中的方法一一对应，并且支持变量替代，减少相似的配置条目。


前端页面继承与复用
----------------
对于前端页面模板，Play框架里同样支持页面继承，Play中使用[Groovy模板引擎](https://www.playframework.com/documentation/1.2.x/templates)。关于页面继承细节可看这篇文章[前端要给力 — 平凡之路](/blog/2015/12/14/twisted-way-to-awesome-fe#section-8)，虽然里面是以Django框架的模板引擎为例，但是原理相同，模板语法略有不同而已。


前端UI组件的沉淀
--------------
在mooctest这个项目中，前端总体上用页面继承和[自定义页面tags](https://www.playframework.com/documentation/1.2.x/templates#tags)来组织。虽然项目起步时偷懒没有引入[RequireJS](/blog/2015/12/14/twisted-way-to-awesome-fe#section-6)来组织js，但最终还是拎出了不少js组件，使用最朴素的js类定义和jquery插件的写法来封装代码。

### 1、动态图表

<img src="/assets/captures/20160124_01.png" style="max-width:719px">

使用[Highcharts](http://www.hcharts.cn)作图表库，由于项目中大部分图表都是动态从后端取数据的，所以在Highcharts上面封装了一层ajax过程，并且将各图表配置options做了剥离。具体细节可见下面这篇文章：

- [为Highcharts做包装](/blog/2015/02/05/ajax-chart-for-highcharts)

### 2、分页插件

<img src="/assets/captures/20160124_02.png" style="max-width:798px">

这是一个jquery插件，可自动生成带“滑动窗口”的分页数目，可支持分页直接刷新页面，或者可自行配置ajax分页替换函数。具体细节可见下面这篇文章：

- [自己写的jquery分页插件](/blog/2015/03/03/step-by-step-jquery-plugin-pagination-1)

### 3、学校选择器

<img src="/assets/captures/20160124_03.png" style="max-width:670px">

这是mooctest项目中最复杂的一个前端功能，并且有多处地方需要编辑学校，需要提供搜索和自定义添加学校的功能。具体实现细节可见下面这个系列文章：

- [一步步做组件-学校选择器(系列)](/blog/2015/02/11/step-by-step-js-component-schoolbox-collections)

这是系列长文，讲述了如何把一段生硬实现的代码一步一步封装和扩展成为一个可配置的UI组件！


多语言的支持
-----------
前端部分讲完了，我们最后再看个和前端略有挂钩的需求，就是多语言支持。要在首页提供中文和英文的选项，并且默认使用系统语言。

### 系统语言判断

	public class Application extends Controller {
		
		static final String DEFAULT_LANGUAGE = "zh_CN";
		
		@Before
		static void setGlobalLang(){
			// langAction会将lang存入session
			String lang = SessionUtil.getLang(session);
	    	if(lang == null){
	    		// 获取浏览器系统语言
	    		List<String> langs = request.acceptLanguage();
	    		for(String temp : langs){
	    			// 浏览器发送的为 zh-CN
	    			if(temp.contains("zh")){
	    				temp = DEFAULT_LANGUAGE;
	    			}
	    			if(Play.langs.contains(temp)){
	    				lang = temp;
	    				break;
	    			}
	    		}
	    		if(lang == null){
	    			lang = DEFAULT_LANGUAGE;
	    		}
	    		// 更新到session
	    		SessionUtil.putLang(session, lang);
	    	}
	    	Lang.set(lang);
		}
	}

这里使用Play框架里的**拦截器**的概念，即上面Annotation的`@Before`，使得每个页面的action都会先执行`setGlobalLang`。语言的判断顺序为：先取session里存的语言，再取浏览器request头里传来的系统支持语言，都取不到时再提供个默认语言。

此外，还需为首页的中英文切换再提供个额外的action

	public class Application extends Controller {
		
		/** 多语言 */
	    public static void langAction(){
	    	String lang = params.get("lang");
	    	setLang(lang);
	    	index("");
	    }
	    
	    static void setLang(String lang){
	    	if(lang == null || !Play.langs.contains(lang)){
	    		lang = DEFAULT_LANGUAGE;
	    	}
	    	// 更新到session
	    	SessionUtil.putLang(session, lang);
	    	Lang.set(lang);
	    }
	}

### 语言字典

在本文最初提到的项目[目录结构](#section-2)中就有关于messages的文件，`messages.zh_CN`和`messages.en`就是中英文的字典文件。

Play框架在这一点方面做的比较简陋，好像一个语言只能有一个字典文件，因此我们需要使用“命名空间”的概念进行分组管理。

	#key格式：页面名.[groupName].xxx
	#通用页面   common.[groupName].xxx

	#首页
	################################
	index.links.guide = GUIDE
	index.links.download = DOWNLOADS

这里配置了英文文案，同样也要在`messages.zh_CN`文件里配置相同key的中文文案。


### 后端返回文案

如果要在后端的`Controller`里向前端返回错误文案，多语言的支持得使用 `play.i18n.Messages`

	// import play.i18n.Messages;

	// 这里的文案key与上面的语言字典中保持一致
	Messages.get("LoginController.accountNotExist")


### 前端的文案

在前端的页面模板中，直接使用 `&{'common.browserTitles.mooctest'}` 就可使用语言字典中的key

但是Play框架只会对模板文件做处理，对其注入通用变量和后端数据，模板文件其实是由后端负责渲染(转成标准html)的。由后端处理的页面模板中可以任意使用 `&{'your_text_key'}` 语言标记，但是这在`.js`文件中是不被支持的。

我们需要在所有页面的base父页面中定义一个内联script，事先定义好所有`.js`中需要使用到的文案。

	<!-- 全局多语言文案，供通用js使用 -->
    <script type="text/javascript">
    window.LANG_TEXT = {
        OK: "&{'common.btn.ok'}",
        CANCEL: "&{'common.btn.cancel'}",
        DONE: "&{'common.btn.done'}"
    };
    </script>

内联script是在模板文件中的，可以被Play框架处理，于是语言文案就被存在了全局`window`里。在具体功能的`.js`文件中可以直接使用`window.LANG_TEXT`变量。


邮件队列与定时任务
----------------
最后我再来说一个后端额外的小功能，发送邮件，由第三方EDM(Email Direct Marketing)商提供服务。

### EDM服务购买

可以在网上找到很多这样的EDM服务商，有的是专门做企业短信和邮件营销的，也有的是域名主机和服务都做的。我这儿就不打广告了，自行找一家有点规模的稳定一点的EDM服务商即可。

### 域名配置

买好EDM账号后，在EDM管理平台上就可发邮件了，但是它们默认会给你分配一个带 `edm04621@service.xxx.com` 类似这样的邮箱。这种邮箱发出来的邮件十有八九会被扔进垃圾箱或者被拦截掉，因此我们要配置自己域名的邮箱。

设置一个域名的mx、txt和cname记录，以example.com域为例：

	edm.example.com CNAME edm.edmcn.cn
	edm.example.com MX sender.f.wsztest.com
	edm.example.com TXT v=spf1 include:spf.ezcdn.cn ~all

域名解析成功后，就可在EDM管理平台使用自己域名验证过的邮箱地址了，比如叫`service@edm.mooctest.net`，就可以大大减少邮件被扔进垃圾箱的概率。

### SMTP接口

上面的配置都完成后，确保在EDM管理平台上可以成功发邮件后，就可以去申请开通EDM-SMTP服务。在程序中可以通过`javax.mail`库去建立邮件Transport协议。

	import java.io.UnsupportedEncodingException;
	import java.util.List;
	import java.util.Properties;

	import javax.mail.MessagingException;
	import javax.mail.Session;
	import javax.mail.Transport;
	import javax.mail.internet.AddressException;
	import javax.mail.internet.InternetAddress;
	import javax.mail.internet.MimeMessage;
	import javax.mail.internet.MimeMessage.RecipientType;

	import common.Constants;
	
	public class SimpleMailSender {

		private static final String SMTP_EDM = "smtp.trigger.edmcn.cn";
		
	    private final transient Properties props = System.getProperties();
	    private transient MailAuthenticator authenticator;
	    private transient Session session;
	    
	    public SimpleMailSender(final String smtpHostName, final String username,
	        final String password) {
	    	init(username, password, smtpHostName);
	    }
	
	    public SimpleMailSender(final String username, final String password) {
	    	String smtpHost;
	    	// EDM帐号
	    	if(isEDM(username)){
	    		smtpHost = SMTP_EDM;
	    	}
	    	else{
	    		smtpHost = "smtp." + username.split("@")[1];
	    	}
	    	
	    	init(username, password, smtpHost);
	    }

	    private void init(String username, String password, String smtpHostName) {
		    props.put("mail.smtp.auth", "true");
		    props.put("mail.smtp.host", smtpHostName);
		    authenticator = new MailAuthenticator(username, password);
		    session = Session.getInstance(props, authenticator);
	    }
	    
	    private boolean isEDM(String account){
	    	if(account.startsWith("edmc") && !account.contains("@")){
	    		return true;
	    	}
	    	return false;
	    }
	    
	    private InternetAddress getSenderAddress() throws AddressException, UnsupportedEncodingException{
	    	if(isEDM(authenticator.getUsername())){
	    		return new InternetAddress(Constants.EDM_SENDER_ADDRESS, Constants.EDM_SENDER_NAME);
	    	}
	    	return new InternetAddress(authenticator.getUsername(), Constants.DEFAULT_SENDER_NAME);
	    }
		
	    public void send(List<String> recipients, String subject, Object content)
	        throws AddressException, MessagingException, UnsupportedEncodingException {
		    final MimeMessage message = new MimeMessage(session);
		    message.setFrom(getSenderAddress());
		    
		    final int num = recipients.size();
		    InternetAddress[] addresses = new InternetAddress[num];
		    for (int i = 0; i < num; i++) {
		        addresses[i] = new InternetAddress(recipients.get(i));
		    }
		    message.setRecipients(RecipientType.TO, addresses);
		    
		    message.setSubject(subject);
		    message.setContent(content.toString(), "text/html;charset=utf-8");
		    Transport.send(message);
	    }
	}

### 队列设计

使用过EDM发送邮件的人会知道，就算我们配置了自己域名的邮箱地址，在使用SMTP协议发送时，也会遇到频率过快，或者对方邮箱拒收，等失败情况。因此我们要设计一套容错和重试的机制。

	import javax.persistence.*;
	import play.db.jpa.Model;

	@Entity
	@Table(name="email_task")
	public class EmailTask extends Model {
		@Column(name="receiver")
		private String receiver;
		
		@Column(name="subject")
		private String subject;
		
		@Column(name="content")
		private String content;
		
		@Column(name="try_times")
		private Integer tryTimes;
		
		public EmailTask(){
			// default
			this.tryTimes = 0;
		}
		// 省略getter和setter
	}

如本文上面提到的[数据库与ORM](#orm)所述，这里设计一个`EmailTask`的Model，记录下收件人、主题和正文内容，再额外存个`tryTimes`字段。这里我们可以规定，当重试3次仍失败后，就忽略该邮件任务。

当发送立即邮件时，比如“忘记密码”的邮件，直接使用上面的`SimpleMailSender`发送邮件，如果失败，则将邮件信息存成`EmailTask`存到数据库。而当发送非立即的邮件时，比如通知类的邮件，只需将邮件内容生成`EmailTask`对象存到数据库，供定时任务来调度。

### 立即任务与定时任务

上面的邮件队列设计中所说的“立即邮件”和“非立即邮件”，其实就是“立即任务”和“定时任务”。在Play框架中有[Jobs](https://www.playframework.com/documentation/1.2.x/jobs)来实现任务调度。

	import play.jobs.Job;

	public class InstantMailJob extends Job {
		
		private static EmailTaskDao taskDao = new EmailTaskDao();
		
		private String receiver;
		private String subject;
		private String content;
		
		public InstantMailJob(String receiver, String subject, String content){
			this.receiver = receiver;
			this.subject = subject;
			this.content = content;
		}

		public void doJob(){
			try {
				MailJobUtil.sendMail(receiver, subject, content);
				
			} catch (Exception e) {
				e.printStackTrace();
				System.out.println("Send mail error for receiver " + receiver);
				
				// 发送失败，加入task，待下次再发
				EmailTask task = new EmailTask();
				task.setReceiver(receiver);
				task.setSubject(subject);
				task.setContent(content);
				// 已失败1次
				task.setTryTimes(1);
				
				taskDao.save(task);
			}
		}
	}

这就是“立即邮件”任务的Job，得 override `doJob`方法，邮件发送失败的话就加入`EmailTask`。使用时如下调用即可

	new InstantMailJob(receiver, subject, content).now();

而对于“非立即邮件”任务，要使用Play框架的定时任务Job，并且设置间隔时间。

	import play.jobs.Every;
	import play.jobs.Job;

	@Every("1mn")
	public class BackgroundMailJob extends Job {
		
		private static EmailTaskDao taskDao = new EmailTaskDao();

		public void doJob(){
			// 避免邮件服务器异常，一次只发前10个
			List<EmailTask> tasks = taskDao.getTopTasks();
			
			for(EmailTask task : tasks){
				try {
					MailJobUtil.sendMail(task.getReceiver(), task.getSubject(), task.getContent());
					
				} catch (Exception e) {
					e.printStackTrace();
					System.out.println("Send mail error for receiver " + task.getReceiver());
					
					// 把当前任务加到队尾
					EmailTask failedTask = new EmailTask();
					failedTask.setReceiver(task.getReceiver());
					failedTask.setSubject(task.getSubject());
					failedTask.setContent(task.getContent());
					// 累计失败次数
					failedTask.setTryTimes(task.getTryTimes() + 1);
					
					taskDao.save(failedTask);
				}
				
				// 删除成功的任务
				taskDao.remove(task);
			}
		}
	}

同样也要 override `doJob`方法，但这里还得设置任务周期 `@Every("1mn")`，这个有点类似linux中的crontab。我这里设置了每1分钟执行一次任务，为了避免邮件SMTP调用频率太快而失败，每次执行Job时只取队列中前几个`EmailTask`。

### 邮件统计数据

这是一开始在EDM管理平台上批量发送邮件的统计数据，发现软退率不低，查看邮局统计后发现是QQ邮箱普遍网关拦截。

<img src="/assets/captures/20160124_04.png" style="max-width:900px">

而下面是使用了EDM-SMTP协议和邮件队列发送的结果统计，可见成功率稍微高一点。倒数第二条记录软退很高，是因为几乎都是QQ邮箱！

<img src="/assets/captures/20160124_05.png" style="max-width:900px">


后记
-----
项目能坚持做下去不容易，写文章更不容易，对自己是个总结，也希望可以帮到更多的人。
