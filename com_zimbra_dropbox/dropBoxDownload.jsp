<%@ page contentType="text/html;charset=UTF-8" language="java"%>
<%@ page import="java.net.*" %>
<%@ page import="java.util.ResourceBundle" %>
<%@ page import="java.io.*" %>
<%@ page language="java" import="org.apache.commons.httpclient.*" %>
<%@ page language="java" import="org.apache.commons.httpclient.methods.*" %>
<%@ page language="java" import="org.apache.commons.httpclient.methods.multipart.*" %>
<%@ page language="java" import="org.apache.commons.httpclient.cookie.CookiePolicy" %>
<%
    /*
    * ***** BEGIN LICENSE BLOCK *****
    * Zimbra Collaboration Suite Zimlets
    * Copyright (C) 2013 Zimbra, Inc.
    *
    * The contents of this file are subject to the Zimbra Public License
    * Version 1.3 ("License"); you may not use this file except in
    * compliance with the License.  You may obtain a copy of the License at
    * http://www.zimbra.com/license.
    *
    * Software distributed under the License is distributed on an "AS IS"
    * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
    * ***** END LICENSE BLOCK *****
    */
    
    response.setHeader("Cache-Control","max-age=0");
    response.addHeader("Cache-Control", "no-cache");
    response.addHeader("Cache-Control", "must-revalidate");
    response.setHeader("Pragma","no-cache");
    response.setDateHeader("Expires", 0); //prevents caching at the proxy server

    javax.servlet.http.Cookie cookies[] = request.getCookies();
    String authTokenString = "";
    for (javax.servlet.http.Cookie cooky : cookies) {
        if (cooky.getName().equals("ZM_AUTH_TOKEN")) {
            authTokenString = cooky.getValue();
        }
    }
    String user = request.getParameter("user");
    String id = request.getParameter("id");
    String part = request.getParameter("part");
    String contentType = request.getParameter("contentType");
    String fileName = request.getParameter("fileName");
    String oauthToken = request.getParameter("oauth_token");
    String oauthSecret = request.getParameter("oauth_signature");
    String appSecret = request.getParameter("appSecret");
    String appKey = request.getParameter("oauth_consumer_key");
    String dropBoxUrl = "https://api-content.dropbox.com/1/files_put/sandbox/" + URLEncoder.encode(fileName, "UTF-8").replaceAll("\\+", "%20") + "?overwrite=false";
    dropBoxUrl += "&oauth_token=" + oauthToken + "&oauth_consumer_key=" + appKey + "&oauth_signature_method=PLAINTEXT";
    dropBoxUrl += "&oauth_version=1.0&oauth_signature=" + oauthSecret + "%26" + appSecret;

    BufferedInputStream in = null;
    String requestURL = request.getRequestURL().toString();
    String requestURI =  request.getRequestURI();
    String baseURL = requestURL.substring(0, requestURL.indexOf(requestURI));
    int count = 0;
    int contentLength = 0;
    String dropboxResponse="";
    try
    {
        //TODO: better way to do this then downloading the file via REST?
        URL url = new URL(baseURL + "/service/home/" + user + "/?id=" + id + "&part=" + part);
        URLConnection uc = url.openConnection();
        javax.servlet.http.Cookie reqCookie[] = request.getCookies();
        for (int i=0; i<reqCookie.length; i++) {
            javax.servlet.http.Cookie cookie = reqCookie[i];
            if (cookie.getName().equals("ZM_AUTH_TOKEN")) {
                uc.setRequestProperty("cookie", cookie.getName() + "=" + cookie.getValue());
            }
        }
        InputStream raw = uc.getInputStream();
        in = new BufferedInputStream(raw);
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();

        byte data[] = new byte[1024];

        while ((count = in.read(data, 0, 1024)) != -1)
        {
            buffer.write(data, 0, count);
            contentLength += count;
        }
        buffer.flush();
        byte[] result = buffer.toByteArray();
        PutMethod filePost = new PutMethod(dropBoxUrl);
        filePost.setRequestEntity(new ByteArrayRequestEntity(result));
        HttpClient client = new HttpClient();
        //TODO: fix hardcoding  proxy
        //client.getHostConfiguration().setProxy("proxy", 3128);
        filePost.addRequestHeader("Authorization", "OAuth");
        filePost.addRequestHeader("Content-Type", contentType);
        filePost.addRequestHeader("Content-Length", "" + contentLength);
        int status = client.executeMethod(filePost);
        dropboxResponse = filePost.getResponseBodyAsString();
        filePost.releaseConnection();
    } catch (Exception e) {
        //TODO: handle exception
    } finally {

    }
%>
<%=dropboxResponse%>
