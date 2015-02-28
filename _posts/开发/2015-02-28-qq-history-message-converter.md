---
layout: post
title: "QQ消息记录转码"
category: 开发
tags: [小玩意]
---
{% include JB/setup %}

和妹子一起有段时间了，期间经历了她电脑重装，我手机崩溃N次，因此现在的情况是我电脑上有我们QQ上的所有聊天记录，而她微信也有我们所有的记录。问题是我看不到她的所有微信记录，她看不到我的所有QQ记录 >_< 我先想着QQ，试着能不能把我这边的数据导出来后再让她导入，以失败告终。我就想着能把我导出的聊天记录，转成网页的格式，方便她看。

<!-- break -->

QQ消息记录
------------
QQ自带的消息管理器中就提供了“导出”功能。

<img src="/assets/captures/20150228_01.jpg" style="max-width:310px;">

导出的文件支持以下3种类型。

<img src="/assets/captures/20150228_02.jpg" style="max-width:374px;">

其中只有`*.bak`类型的文件才能导入，但是只能自己导入自己的，我导出的文件给她后她是无法导入的，因为文件是加密过的，还有消息的sender/receiver也不一样，一直报错，只好弃了。

而`*.txt`文件简单是简单，缺少表情和图片，跟看手机小说似的 =_=



*.mht文件格式
---------------
<img src="/assets/captures/20150228_03.jpg" style="max-width:100%;">

可以看到它其实是在HTML格式上加了一些其它信息，文件的头部就是这样的，以后每一条消息就是一个`<tr>`。所有消息的最后是`</table></body></html>`结尾。文件中的HTML部分只占一小部分，在`</html>`结束后又追加了一大片表情和图片的编码信息。

<img src="/assets/captures/20150228_04.jpg" style="max-width:100%;">

其中都采用了base64编码，而HTML中的img src都指向这里的`{xxxx}.dat`

于是思路就很清晰了

1. 先把base64编码的表情图片解码出来，并生成相应的文件

2. 把`*.mht`文件中非HTML的部分去掉

3. 把img src重新替换



解码图片
----------
我使用的是Java，查了下只需要import`sun.misc.BASE64Decoder`即可。在eclipse中可能无法识别这个包，只需要在Build Path中把JRE Library删了再重新添加一下就OK了。

然后base64的解码就很简单了

    private boolean decodeImage(String imgStr, String imgFile){
        if(imgStr == null){
            return false;
        }
        
        BASE64Decoder decoder = new BASE64Decoder();
        
        try {
            // base64解码
            byte[] b = decoder.decodeBuffer(imgStr);
            
            // 生成图片
            OutputStream out = new FileOutputStream(imgFile);
            
            out.write(b);
            out.flush();
            out.close();
            return true;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }


有了这个，我们就要对`*.mht`文件进行第一遍扫描，对每个图片编码的地方都调用该`decodeImage`

    private void generateImages(){
        try {
            BufferedReader br = new BufferedReader(new FileReader(rawFileRoot + rawFileName + "." + rawFileExt));
            
            skipRawHead(br);
            String temp;
            
            while((temp = br.readLine()) != null){
                //读到image
                //Content-Type:image/gif
                if(temp.startsWith("Content-Type:")){
                    String fileExt = temp.split("/")[1];
                    
                    //Content-Transfer-Encoding:base64
                    temp = br.readLine();
                    
                    //Content-Location:{2E66FE72-A0EE-4982-A5E1-A7FD3F564743}.dat
                    temp = br.readLine();
                    
                    String fileName = temp.substring(18, temp.length() - 5);
                    String fileNameDat = temp.substring(17);
                    
                    //空行
                    temp = br.readLine();
                    
                    //读image的base64数据
                    StringBuilder builder = new StringBuilder();
                    while((temp = br.readLine()).length() != 0){
                        builder.append(temp);
                    }
                    
                    //image转码(.dat)
                    decodeImage(builder.toString(), outImageRoot + fileNameDat);
                    //image转码(.ext)
                    decodeImage(builder.toString(), outImageRoot + fileName + "." + fileExt);
                    
                    //完成
                    System.out.println("Image: " + fileNameDat);
                }
            }
            
            br.close();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

这里我们就是去判断那些特殊的行，读出图片的文件类型和文件名，然后把base64编码成的字符串读到buffer中，最后调用`decodeImage`。注意这里调用了两次，一次是生成`*.dat`文件，方便HTML中img src替换，不需要管图片是jpg还是gif了。而第二次调用是生成原始的图片文件，包含图片扩展名，是为了收藏 ^_^



生成HTML
----------
如果仅是把`*.mht`文件中非HTML的部分去掉，那么只要把读到的有效行写入新的文件即可。但是导出的`*.mht`文件通常要上百兆，如果聊天记录多的话，最后生成的HTML都在一个文件里，扔到浏览器中肯定会卡。因此至少把聊天记录按照“年-月”切分出来。

在原始文件中，可以看到聊天“日期”是像这样子存在的。

<img src="/assets/captures/20150228_05.jpg" style="max-width:100%;">

因此我们用`.*日期: (\d{4}-\d{2}-\d{2})</td></tr>.*`这样一个正则就能识别出。唯独加好友后的第一条消息的日期是跟`<html><head>`同一行的。

<img src="/assets/captures/20150228_06.jpg" style="max-width:100%;">

我们每次读到一个新的“年-月”时，就结束前一个输出文件，另起一个输出文件，把上面的`<html><head>`信息先写到新的输出文件中。

    private void generateHTML(){
        try {
            System.out.println("Generating output html...");
            
            BufferedReader br = new BufferedReader(new FileReader(rawFileRoot + rawFileName + "." + rawFileExt));
            BufferedWriter bw = null;
            
            skipRawHead(br);
            String temp;
            
            //日期正则
            Pattern pattern = Pattern.compile(".*日期: (\\d{4}-\\d{2}-\\d{2})</td></tr>.*");
            Matcher matcher;
            
            // 当前的yyyy-MM，对所有记录按照年月汇总
            String current = null;
            
            // 每个html文件的头部（除第一次读到的日期）
            String htmlHead = null;
            
            
            while((temp = br.readLine()) != null){
                if(htmlHead == null){
                    htmlHead = temp.replaceFirst("<tr>.*>日期: (\\d{4}-\\d{2}-\\d{2})</td></tr>.*", "");
                }
                
                //判断日期
                matcher = pattern.matcher(temp);
                if(matcher.matches()){
                    String date = matcher.group(1);
                    date = date.substring(0, date.lastIndexOf("-"));
                    
                    if(!date.equals(current)){
                        current = date;
                        System.out.println(current);
                        
                        if(bw != null){
                            bw.write("</table></body></html>");
                            bw.flush();
                            bw.close();
                        }
                        
                        //另起一文件（按年月）
                        bw = new BufferedWriter(new FileWriter(outHTMLRoot + rawFileName + "-" + current + "." + outFileExt));
                        bw.write(htmlHead);
                        bw.newLine();
                        bw.flush();
                    }
                }
                
                //替换源文件中的img src（加个目录）
                temp = temp.replaceAll("<IMG src=\"", "<IMG src=\"src/");
                
                bw.write(temp);
                bw.newLine();
                bw.flush();
                
                //标准html结束
                if(temp.endsWith("</html>")){
                    break;
                }
            }
            
            br.close();
            bw.close();
            
            System.out.println("Done.");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

注意这里有个`skipRawHead(br)`是为了跳过`*.mht`头部的几行，直接从`<html>`开始读，一行一行读，一行就是一条消息。

<img src="/assets/captures/20150228_03.jpg" style="max-width:100%;">

最后生成后的结果，src文件夹中就存放着所有解码出来的表情图片以及图片的`*.dat`文件。

<img src="/assets/captures/20150228_07.jpg" style="max-width:600px;">



后续
------
把聊天记录打包发给了妹子，我能想到最浪漫的事，就是在那一天的时候和你一起躲在房间里看聊天记录，回想当初如何相识相知，和一路走来的点点滴滴。

<img src="/assets/photos/hughug.jpg" style="max-width:256px;">

记录/记忆有喜当然也有悲，生活就是这样，看你觉得哪个更重要。

献上[源代码](/code/QQHistoryMessage/v1/Converter.java)~（程序员不是书呆子）
