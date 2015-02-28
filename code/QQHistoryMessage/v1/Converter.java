import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import sun.misc.BASE64Decoder;

public class Converter {
	
	private String rawFileRoot;
	private String rawFileExt;
	
	private String outFileRoot;
	private String outFileExt;
	
	private String rawFileName;
	private String outImageRoot;
	private String outHTMLRoot;
	
	
	public Converter(String historyFile, String outputPath){
		// "input/latest.mnt"
		int lastPathIndex = historyFile.lastIndexOf("/");
		int lastExtIndex = historyFile.lastIndexOf(".");
		
		this.rawFileRoot = historyFile.substring(0, lastPathIndex + 1);				// input/
		this.rawFileName = historyFile.substring(lastPathIndex + 1, lastExtIndex);	// lastest
		this.rawFileExt = historyFile.substring(lastExtIndex + 1);					// mnt
		
		// "output/"
		this.outFileRoot = outputPath.endsWith("/") ? outputPath : (outputPath + "/");
		this.outFileExt = "html";
		
		this.outHTMLRoot = this.outFileRoot + this.rawFileName + "/";
		this.outImageRoot = this.outHTMLRoot + "src/";
		
		// 创建output目录（最深目录）
		new File(outImageRoot).mkdirs();
	}
	
	public void run(){
		//====================
		// 第一遍扫描，生成image
		//====================
		generateImages();
		
		//====================
		// 第二遍扫描，生成标准html
		//====================
		generateHTML();
	}
	
	
	
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
	
	private void skipRawHead(BufferedReader br) throws IOException{
		// 跳过rawFile head信息
		for(int i=0; i<12; i++){
			br.readLine();
		}
	}
	
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
		        
		        //替换源文件中的img src
				// /\{\S*\}.dat/
				//FUCK: 上面的js正则在java里怎么表示
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
	
	
	public static void main(String[] args){
		Converter converter = new Converter("input/latest.mht", "output/");
		converter.run();
	}
	
}
