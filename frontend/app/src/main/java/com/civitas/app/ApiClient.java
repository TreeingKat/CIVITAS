package com.civitas.app;

import android.content.Context;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public final class ApiClient {
    public interface Callback { void done(JSONObject result, Exception error); }
    private static final String BASE_URL="http://10.0.2.2:8080/api"; // Set your LAN host for a physical device.
    private final Context context;
    public ApiClient(Context context){this.context=context.getApplicationContext();}
    public void post(String path,JSONObject body,Callback callback){request("POST",path,body,callback);}
    public void get(String path,Callback callback){request("GET",path,null,callback);}
    private void request(String method,String path,JSONObject body,Callback callback){new Thread(()->{HttpURLConnection connection=null;try{connection=(HttpURLConnection)new URL(BASE_URL+path).openConnection();connection.setRequestMethod(method);connection.setConnectTimeout(10000);connection.setReadTimeout(10000);connection.setRequestProperty("Content-Type","application/json");String token=context.getSharedPreferences("civitas",Context.MODE_PRIVATE).getString("token",null);if(token!=null)connection.setRequestProperty("Authorization","Bearer "+token);if(body!=null){connection.setDoOutput(true);try(OutputStream out=connection.getOutputStream()){out.write(body.toString().getBytes(StandardCharsets.UTF_8));}}int status=connection.getResponseCode();InputStream stream=status<400?connection.getInputStream():connection.getErrorStream();String text=new String(stream.readAllBytes(),StandardCharsets.UTF_8);JSONObject result;try{result=new JSONObject(text);}catch(Exception ignored){result=new JSONObject().put("message",text);}if(status>=400)throw new IOException(result.optString("message","Request failed ("+status+")"));JSONObject finalResult=result;android.os.Handler handler=new android.os.Handler(context.getMainLooper());handler.post(()->callback.done(finalResult,null));}catch(Exception error){android.os.Handler handler=new android.os.Handler(context.getMainLooper());handler.post(()->callback.done(null,error));}finally{if(connection!=null)connection.disconnect();}}).start();}
}
