---
layout: post
title: "eclipse中集成Hibernate"
keywords: eclipse, Hibernate, HibernateTools, Java, DAO, 泛型编程, 软件工程
category: 开发
tags: [Hibernate, 泛型编程]
---
{% include JB/setup %}


前一阵子帮别人有偿做本科毕设的XX管理系统，对方要求一定要Java，不然他没学过不利于答辩。想我们大软院从大一开始就在做XX管理系统了，大二大三只是学的内容不一样，但大作业的载体都是该死的XX管理系统。从原生Java Swing做的靠文件读写数据的XX管理系统，到下学期加入数据库读写的，再过一学期用jsp做网页版的XX管理系统，然后再用J2EE框架，或者换php再实现一个XX管理系统。最后熬到坑爹的研究生，第一学期云计算课程先用传统方式实现一个XX管理系统，然后再把数据迁移到云平台上做实验。好吧，我错了，不知不觉又习惯喷了<img src="/assets/photos/wulian.jpg" style="width:56px; vertical-align:text-top;">

<!-- break -->

其实我想说的是要不是看在同学的份上，真不想做这个事情，还要求Java，真不想碰Swing的东西了，也不想烦人的Struts。有人要网页版，我就用更简单易学的[Play Framework](www.playframework.com)（我都用较早的1.2.7版本）。而还有人要窗口程序，不得以去查了查简单的办法。



准备
-----
我用的是较早的eclipse 3.6.2 helios。对于Swing窗口程序的搭建，我使用了[WindowBuilder](http://www.eclipse.org/windowbuilder/)插件，因为以前用过的[VisualEditor](http://wiki.eclipse.org/Visual_Editor_Project)貌似现在不维护了。

由于XX管理系统都涉及到增删改查操作，这种sql写起来就是纯粹苦力活。以前在MyEclipse中用过Struts + Hibernate（MyEclipse中均自带这些插件），但是苦于MyEclipse太大了，启动太慢，所以我想办法把Hibernate装到eclipse中。



Hibernate插件安装
------------------
1. 打开eclipse -> Help -> Install New Software
2. 添加 http://download.jboss.org/jbosstools/updates/stable/helios/
3. 选择All JBoss Tools下的Hibernate Tools即可（因为Hibernate被JBoss收了，只需装这一个就行）

<img src="/assets/photos/20140525_01.jpg" style="width:694px;">

漫长的等待

<img src="/assets/photos/20140525_02.jpg" style="width:532px;">

注意，有可能安装出错，我试了两三次才好（叹气）

<img src="/assets/photos/20140525_03.jpg" style="width:378px;">

最后这个关于unsigned的Warning无视之，直接OK后就安装成功了^_^

<img src="/assets/photos/20140525_04.jpg" style="width:548px;">



Hibernate Config
-----------------
HibernateTool安装完成后，在eclipse中就会多了一个Hibernate perspective。

点击菜单栏中的<img src="/assets/photos/hibernate-icon.jpg" style="width:48px;">这个图标，打开"Hibernate Code Generation Configurations"，我们新建一个Configuration。

<img src="/assets/photos/20140525_05.jpg" style="width:593px;">

<img src="/assets/photos/20140525_06.jpg" style="width:593px;">



Hibernate Session Factory
--------------------------
首先看一段hibernate.cfg.xml中的配置

    <session-factory>
        <property name="hibernate.connection.driver_class">org.gjt.mm.mysql.Driver</property>
        <property name="hibernate.connection.password">123123</property>
        <property name="hibernate.connection.url">jdbc:mysql://localhost/factory_manage</property>
        <property name="hibernate.connection.username">root</property>
        <property name="hibernate.dialect">org.hibernate.dialect.MySQLInnoDBDialect</property>
        
        <property name="current_session_context_class">thread</property>
        <mapping resource="pojo/User.hbm.xml" />
        <!-- 省略其他表项 -->
    </session-factory>

然后创建一个hibernate的package，新建HibernateSessionFactory.java，内容如下。

    package hibernate;

    import org.hibernate.HibernateException;
    import org.hibernate.Session;
    import org.hibernate.cfg.Configuration;

    /**
     * Configures and provides access to Hibernate sessions, tied to the
     * current thread of execution.  Follows the Thread Local Session
     * pattern, see {@link http://hibernate.org/42.html }.
     */
    public class HibernateSessionFactory {

        /** 
         * Location of hibernate.cfg.xml file.
         * Location should be on the classpath as Hibernate uses  
         * #resourceAsStream style lookup for its configuration file. 
         * The default classpath location of the hibernate config file is 
         * in the default package. Use #setConfigFile() to update 
         * the location of the configuration file for the current session.   
         */
        private static String CONFIG_FILE_LOCATION = "/hibernate.cfg.xml";
        private static final ThreadLocal<Session> threadLocal = new ThreadLocal<Session>();
        private  static Configuration configuration = new Configuration();    
        private static org.hibernate.SessionFactory sessionFactory;
        private static String configFile = CONFIG_FILE_LOCATION;

        static {
            try {
                configuration.configure(configFile);
                sessionFactory = configuration.buildSessionFactory();
            } catch (Exception e) {
                System.err
                        .println("%%%% Error Creating SessionFactory %%%%");
                e.printStackTrace();
            }
        }
        private HibernateSessionFactory() {
        }
        
        /**
         * Returns the ThreadLocal Session instance.  Lazy initialize
         * the <code>SessionFactory</code> if needed.
         *
         *  @return Session
         *  @throws HibernateException
         */
        public static Session getSession() throws HibernateException {
            Session session = (Session) threadLocal.get();

            if (session == null || !session.isOpen()) {
                if (sessionFactory == null) {
                    rebuildSessionFactory();
                }
                session = (sessionFactory != null) ? sessionFactory.openSession()
                        : null;
                threadLocal.set(session);
            }

            return session;
        }

        /**
         *  Rebuild hibernate session factory
         *
         */
        public static void rebuildSessionFactory() {
            try {
                configuration.configure(configFile);
                sessionFactory = configuration.buildSessionFactory();
            } catch (Exception e) {
                System.err
                        .println("%%%% Error Creating SessionFactory %%%%");
                e.printStackTrace();
            }
        }

        /**
         *  Close the single hibernate session instance.
         *
         *  @throws HibernateException
         */
        public static void closeSession() throws HibernateException {
            Session session = (Session) threadLocal.get();
            threadLocal.set(null);

            if (session != null) {
                session.close();
            }
        }

        /**
         *  return session factory
         *
         */
        public static org.hibernate.SessionFactory getSessionFactory() {
            return sessionFactory;
        }

        /**
         *  return session factory
         *
         *  session factory will be rebuilded in the next call
         */
        public static void setConfigFile(String configFile) {
            HibernateSessionFactory.configFile = configFile;
            sessionFactory = null;
        }

        /**
         *  return hibernate configuration
         *
         */
        public static Configuration getConfiguration() {
            return configuration;
        }

    }

注：这段代码是我以前在MyEclipse中用Hibernate时自动生成的，这里我不知道怎么生成，所以就直接复制了过来。

同样，再新建一个HibernateSessionFactoryUtil.java，内容如下。

    package hibernate.util;

    import org.hibernate.SessionFactory;
    import org.hibernate.cfg.Configuration;

    public class HibernateSessionFactoryUtil {

        private static final SessionFactory sessionFactory;
        
        static
        {
            try {
                sessionFactory = new Configuration().configure().buildSessionFactory();
            } catch (Throwable e) {
                /*
                 * 需要捕获Throwable对象，
                 * 否则捕获不到Error及其子类，以及NoClassDefFoundError类型的错误
                 */
                throw new ExceptionInInitializerError(e);
            }
        }
        
        private HibernateSessionFactoryUtil(){}
        
        public static SessionFactory getSessionFactory()
        {
            return sessionFactory;
        }
        
    }



DAO泛型编程
------------
创建dao.interfaces的package，新建GenericDao.java，内容如下。

    package dao.interfaces;

    import java.io.Serializable;
    import java.util.ArrayList;

    public interface GenericDao<T, PK extends Serializable> {

        /**
         * 根据主键取对象
         * @param id 主键
         * @return T 找不到时返回null
         */
        public T findById(PK id);
        
        
        /**
         * 取出表中所有对象
         * @return ArrayList
         */
        public ArrayList<T> findAll();
        
        
        /**
         * 存一个完整对象，并返回主键
         * @param entity 完整对象
         * @return PK 主键
         */
        public PK save(T entity);
        
        
        /**
         * 更新一个对象，主键找不到时改为存一个对象
         * @param entity 完整对象
         * @return boolean
         */
        public boolean update(T entity);
        
        
        /**
         * 删除一个完整对象
         * @param entity 完整对象
         * @return boolean
         */
        public boolean delete(T entity);
        
        
        /**
         * 根据主键删除一个对象
         * @param id 主键
         * @return boolean
         */
        public boolean delete(PK id);
        
    }

相应地，创建dao.hibernate的package，新建GenericDaoHibernate.java，内容如下。

    package dao.hibernate;

    import java.io.Serializable;
    import java.lang.reflect.ParameterizedType;
    import java.util.ArrayList;

    import org.hibernate.Query;
    import org.hibernate.Session;
    import org.hibernate.Transaction;

    import dao.interfaces.GenericDao;
    import hibernate.util.HibernateSessionFactoryUtil;

    public abstract class GenericDaoHibernate<T, PK extends Serializable> implements GenericDao<T, PK> {

        private Class<T> clazz;
        
        public GenericDaoHibernate()
        {
            //反射获取T.class，实参类型
            clazz = (Class<T>)((ParameterizedType)getClass().getGenericSuperclass()).getActualTypeArguments()[0];
        }
        
        @Override
        public T findById(PK id)
        {
            T entity = null;
            
            try {
                Session session = HibernateSessionFactoryUtil.getSessionFactory().getCurrentSession();
                Transaction tx = session.beginTransaction();
                
                try {
                    entity = (T) session.get(clazz, id);
                    tx.commit();
                    
                } catch (Exception e) {
                    tx.rollback();
                    e.printStackTrace();
                }
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        
            return entity;
        }
        
        @Override
        public ArrayList<T> findAll()
        {
            ArrayList<T> result = new ArrayList<T>();
            
            try {
                Session session = HibernateSessionFactoryUtil.getSessionFactory().getCurrentSession();
                Transaction tx = session.beginTransaction();
                
                try {
                    Query query = session.createQuery("from " + clazz.getName());
                    result = new ArrayList<T>(query.list());
                    tx.commit();
                    
                } catch (Exception e) {
                    tx.rollback();
                    e.printStackTrace();
                }
                
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            return result;
        }
        
        @Override
        public PK save(T entity)
        {
            //boolean result = false;
            PK result = null;
            
            try {
                Session session = HibernateSessionFactoryUtil.getSessionFactory().getCurrentSession();
                Transaction tx = session.beginTransaction();
                
                try {
                    //result = true;
                    result = (PK) session.save(entity);
                    tx.commit();
                    
                } catch (Exception e) {
                    tx.rollback();
                    e.printStackTrace();
                }
                
            } catch (Exception e) {
                e.printStackTrace();
            }

            return result;
        }
        
        @Override
        public boolean update(T entity)
        {
            boolean result = false;
            
            try {
                Session session = HibernateSessionFactoryUtil.getSessionFactory().getCurrentSession();
                Transaction tx = session.beginTransaction();
                
                try {           
                    session.saveOrUpdate(entity);
                    result = true;
                    tx.commit();
                    
                } catch (Exception e) {
                    tx.rollback();
                    e.printStackTrace();
                }
                
            } catch (Exception e) {
                e.printStackTrace();
            }

            return result;
        }
        
        @Override
        public boolean delete(T entity)
        {
            boolean result = false;
            
            try {
                Session session = HibernateSessionFactoryUtil.getSessionFactory().getCurrentSession();
                Transaction tx = session.beginTransaction();
                
                try {
                    session.delete(entity);
                    result = true;
                    tx.commit();
                    
                } catch (Exception e) {
                    tx.rollback();
                    e.printStackTrace();
                }
                
            } catch (Exception e) {
                e.printStackTrace();
            }

            return result;
        }
        
        @Override
        /**
         * 此法不好，暂时这样
         */
        public boolean delete(PK id)
        {
            boolean result = false;
            
            try {
                T entity = findById(id);
                
                if(entity!=null && delete(entity)==true)
                    result = true;
                
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            return result;
        }
        
    }

有了GenericDao的基础，对于其他具体实体类，我们只需要定义一个它的接口类去继承GenericDao，像这样

`public interface UserDao extends GenericDao<User, Integer>` 在这里定义它的特有方法

对于接口的实现类，像这样

`public class UserDaoHibernate extends GenericDaoHibernate<User, Integer> implements UserDao`

因此有了泛型DAO，就不必为每个实体都写一套大同小异的最基础的增删改查操作了。



总结
-----

