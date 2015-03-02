---
layout: post
title: "JPA泛型DAO"
category: 开发
tags: [JPA, 泛型编程]
---
{% include JB/setup %}

JPA全称Java Persistence API。JPA通过JDK 5.0注解或XML描述对象关系表的映射关系，并将运行期的实体对象持久化到数据库中（摘自百度百科）。本篇结合自己的项目经历，使用的框架是Play Framework 1.2.7，其JPA底层采用的是Hibernate 3.6的实现，来讲述基于JPA构建一个泛型DAO（Data Access Object）。

<!-- break -->

背景知识
----------
关于JPA就不多做介绍了，如果用过Hibernate或Spring，就会对JPA一目了然。可以点击这里看看[JPA概要](http://www.cnblogs.com/holbrook/archive/2012/12/30/2839842.html)。我之前也写过一篇介绍在eclipse中集成Hibernate的文章中也提到了[DAO泛型编程](/blog/2014/05/25/integrate-hibernate-into-eclipse/#dao)。


问题来源
----------
项目中有好多实体，比如说老师、学生，还有考试，那么就有对应的DAO叫`TeacherDao`、`StudentDao`和`ExamDao`。虽然JPA对实体提供了方便的`find`查询，但是还得在`TeacherDao`里写个比如`findTeachersBySchool`，在`StudentDao`里写个比如`findStudentsByTeacher`，或者在`ExamDao`里写个`findExamsByTeacherAndStudent`等等的方法，而其方法内部通过JPA为实体附加的`find`查询来实现。现在的问题是在不同实体对应的DAO类里存在着一堆看起来相似的方法（只是`find`里的参数和方法的返回值不同），这就是典型的应该使用泛型的场景。



泛型DAO
---------
1.我们首先要建一个叫`GenericDao`的抽象类

    public abstract class GenericDao<T, PK extends Serializable> {
        private Class<T> clazz;

        public GenericDao(){
            // 反射获取T.class，实参类型
            clazz = (Class<T>)((ParameterizedType)getClass().getGenericSuperclass()).getActualTypeArguments()[0];
        }
    }

T代表实体类型，PK代表主键类型。


2.实体对应的DAO类去继承`GenericDao`

    public class ExamDao extends GenericDao<Exam, Long> {

    }

这里`Exam`是实体类型，`Long`是主键类型。


3.业务层使用DAO时创建具体DAO的实例

    ExamDao examDao = new ExamDao();


我们系统中所有的DAO都按照这样的规范来写：

a) 可以采用统一实现的方法都写在`GenericDao`中

b) 具体DAO中实现各不相同的方法，在`GenericDao`定义抽象方法，并在各自的DAO类中实现

c) 具体DAO中特有的方法就写在自己的DAO类里



统一实现的query
----------------

    public T findById(PK id){
        return (T) JPA.em().find(clazz, id);
    }

    public List<T> findAll(){
        return (List<T>) JPA.em().createQuery("select e from " + clazz.getName() + " e").getResultList();
    }

    public void save(T instance){
        JPA.em().persist(instance);
    }
    
    public void saveList(List<T> instances){
        EntityManager manager = JPA.em();
        for (T instance : instances){
            manager.persist(instance);
        }
    }

    public void refresh(T instance){
        JPA.em().refresh(instance);
    }
    
    public void delete(PK id){
        JPA.em().createQuery("delete from " + clazz.getName() + " e where e.id=" + id).executeUpdate();
    }

这是拍脑袋首先想出来的一些方法，最最简单的增删改查，肯定每个实体的DAO中都要用到。大致看看好像没有问题，但是细思极恐，因为一般系统中用的最多的是按条件且带分页的查询，甚至还带排序，简单一个`findAll`真是图样图森破。


1.首先我们要实现一个带分页带排序项的`findAll`方法。

    public List<T> findAll(int pageNo, String orderBy, String order){
        return find(getHQLString(null, null, orderBy, order), new Object[]{}, pageNo);
    }

这里的`find`内部利用Java反射，调用了JPA为具体实体类附加的查询方法。

    protected List<T> find(String query, Object[] params, Integer pageNo){
        try {
            Method method = clazz.getMethod("find", new Class[]{String.class, Object[].class});
            JPAQuery queryObj = (JPAQuery) method.invoke(clazz, new Object[]{query, params});
            
            if(pageNo != null){
                return queryObj.fetch(pageNo, Constants.PAGE_SIZE);
            }
            else{
                return queryObj.fetch();
            }
            
        } catch (Exception e) {
            return new ArrayList<T>();
        }
    }

这里的`pageNo`是`Integer`类型，为`null`时代表不分页。而`query`是我们手工拼成的一个HQL query，下面来看看这个方法。

    private String getHQLString(String[] columns, String[] signs, String orderBy, String order){
        StringBuilder builder = new StringBuilder();
        
        if(columns != null && columns.length > 0){
            for(int i=0; i<columns.length; i++){
                builder.append(columns[i] + " " + signs[i] + " ?");
                if(i < columns.length - 1){
                    builder.append(" and ");
                }
            }
        }
        
        if(orderBy != null){
            builder.append(" order by " + orderBy + " " + order);
        }
        return builder.toString();
    }

这里`columns`表示查询需要比较的字段，而`signs`表示比较时的符号（小于、等于、大于等等）。最后返回的HQL形如`columnX = ? and columnY < ? orderBy columnZ desc`。最后将这个HQL传给`find`，配上实际的参数值（即“?”的填充值），再调用JPA提供的`find`来`fetch`出相应的结果，以完成分页查询。这个查询过程就如此，注意这里我们将“页”的大小存到了一个常量中。


2.为`signs`和`order`定义一些常量，以及帮助方法。

    public static final String SIGN_EQUALS = "=";
    public static final String SIGN_LESS_THAN = "<";
    public static final String SIGN_GREATER_THAN = ">";
    public static final String SIGN_LESS_EQUALS_THAN = "<=";
    public static final String SIGN_GREATER_EQUALS_THAN =">=";
    public static final String ORDER_ASC = "asc";
    public static final String ORDER_DESC = "desc";

    private String[] getDefaultSigns(int length){
        String[] signs = new String[length];
        for(int i=0; i<length; i++){
            signs[i] = SIGN_EQUALS;
        }
        return signs;
    }


3.有了以上的基础，我们可以顺势写出好多`findBy`方法出来。

    public List<T> findBy(String[] columns, Object[] values, String[] signs, int pageNo, String orderBy, String order){
        return find(getHQLString(columns, signs, orderBy, order), values, pageNo);
    }
    
    public List<T> findBy(String[] columns, Object[] values, String[] signs, int pageNo){
        return find(getHQLString(columns, signs, null, null), values, pageNo);
    }
    
    public List<T> findBy(String[] columns, Object[] values, int pageNo, String orderBy, String order){
        String[] signs = getDefaultSigns(columns.length);
        return find(getHQLString(columns, signs, orderBy, order), values, pageNo);
    }
    
    public List<T> findBy(String[] columns, Object[] values, int pageNo){
        String[] signs = getDefaultSigns(columns.length);
        return find(getHQLString(columns, signs, null, null), values, pageNo);
    }
    
    public List<T> findBy(String column, Object value, int pageNo, String orderBy, String order){
        return find(getHQLString(new String[]{column}, new String[]{SIGN_EQUALS}, orderBy, order), new Object[]{value}, pageNo);
    }
    
    public List<T> findBy(String column, Object value, int pageNo){
        return find(getHQLString(new String[]{column}, new String[]{SIGN_EQUALS}, null, null), new Object[]{value}, pageNo);
    }
    
    public List<T> findLessThan(String column, Object value, int pageNo, String orderBy, String order){
        return find(getHQLString(new String[]{column}, new String[]{SIGN_LESS_THAN}, orderBy, order), new Object[]{value}, pageNo);
    }
    
    public List<T> findLessThan(String column, Object value, int pageNo){
        return find(getHQLString(new String[]{column}, new String[]{SIGN_LESS_THAN}, null, null), new Object[]{value}, pageNo);
    }
    
    public List<T> findGreaterThan(String column, Object value, int pageNo, String orderBy, String order){
        return find(getHQLString(new String[]{column}, new String[]{SIGN_GREATER_THAN}, orderBy, order), new Object[]{value}, pageNo);
    }
    
    public List<T> findGreaterThan(String column, Object value, int pageNo){
        return find(getHQLString(new String[]{column}, new String[]{SIGN_GREATER_THAN}, null, null), new Object[]{value}, pageNo);
    }
    

4.同理，我们还可以写出`findIn`方法。

    private String getInHQLString(String column, int inLength, String orderBy, String order){
        StringBuilder builder = new StringBuilder(column);
        
        if(inLength > 0){
            builder.append(" in (");
            
            for(int i=0; i<inLength; i++){
                builder.append("?");
                if(i < inLength - 1){
                    builder.append(",");
                }
            }
            
            builder.append(")");
        }
        
        if(orderBy != null){
            builder.append(" order by " + orderBy + " " + order);
        }
        return builder.toString();
    }

    public List<T> findIn(String column, Object[] values, int pageNo, String orderBy, String order){
        return find(getInHQLString(column, values.length, orderBy, order), values, pageNo);
    }
    
    public List<T> findIn(String column, Object[] values, int pageNo){
        return find(getInHQLString(column, values.length, null, null), values, pageNo);
    }

当然我们还能写出`findIn`和`findBy`混合的方法，即部分字段用符号比较，而部分字段用`in`比较。还可以写一堆`count`方法，我们这里就不再罗列了。



总结
------
泛型编程是减少代码冗余的利器，尤其是在DAO层面的泛型，可以将HQL或SQL语句都封装到一个类中，外部使用时只需调用方法和传参即可，降低了程序员写SQL出错的可能性。
