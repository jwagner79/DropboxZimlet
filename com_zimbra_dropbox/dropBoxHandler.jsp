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
//TODO: Translations, Clean up the ugly JS
    String notApproved = request.getParameter("not_approved");
    if (notApproved == null) {
        notApproved = "";
    }
%>
<html>
<head>
    <title>Dropbox Authentication</title>
    <style type="text/css">
            /* liberally borrowed from dropbox.com */
        BODY {
            font-family: "Open Sans","lucida grande","Segoe UI",arial,verdana,"lucida sans unicode",tahoma,sans-serif;
        }
        .header,
        .body,
        .buttonBar {
            text-align:center;
            padding:1em 0;
        }
        .buttonBar .button {
            text-align:center;
            padding:5px 10px;
            font-size:13px;
            font-weight:600;
            cursor:pointer;
            overflow:visible;
            display:inline-block;
            color:white;
            border-top:1px #2270AB solid;
            border-right:1px #18639A solid;
            border-bottom:1px #0F568B solid;
            border-left:1px #18639A solid;
            background:#2180CE;filter:progid:DXImageTransform.Microsoft.gradient(startColorstr="#33A0E8", endColorstr="#2180CE");
            background:-webkit-gradient(linear, left top, left bottom, from(#33A0E8), to(#2180CE));
            background:-moz-linear-gradient(top, #33A0E8, #2180CE);
            text-shadow:#355782 0 1px 2px;
            -webkit-border-radius:3px;
            -moz-border-radius:3px;
            -ms-border-radius:3px;
            border-radius:3px;
            -webkit-text-shadow:#355782 0 1px 2px;
            -moz-text-shadow:#355782 0 1px 2px;
            -moz-box-shadow:0 1px 1px rgba(0,0,0,0.3),inset 0px 1px 0px #83C5F1;
            -webkit-box-shadow:0 1px 1px rgba(0,0,0,0.3),inset 0px 1px 0px #83C5F1;
            box-shadow:0 1px 1px rgba(0,0,0,0.3),inset 0px 1px 0px #83C5F1;
        }
        .buttonBar .button:hover {
            text-decoration:none;
            border-top:1px #0070CC solid;
            border-right:1px #006AC1 solid;
            border-bottom:1px #005CA6 solid;
            border-left:1px #006AC1 solid;
            -moz-box-shadow:0 1px 1px rgba(0,0,0,0.3),inset 0 0 3px #35BFF4;
            -webkit-box-shadow:0 1px 1px rgba(0,0,0,0.3),inset 0 0 3px #35BFF4;
            box-shadow:0 1px 1px rgba(0,0,0,0.3),inset 0 0 3px #35BFF4;
        }
        .buttonBar .button:active {
            border-top:1px #2270AB solid;
            border-right:1px #186299 solid;
            border-bottom:1px #0F568B solid;
            border-left:1px #186299 solid;
            background:#2F97D7;
            filter:progid:DXImageTransform.Microsoft.gradient(startColorstr="#1866A6", endColorstr="#2F97D7");
            background:-webkit-gradient(linear, left top, left bottom, from(#1866A6), to(#2F97D7));
            background:-moz-linear-gradient(top, #1866A6, #2F97D7);
            -moz-box-shadow:0 0 0 #000,inset 0 2px 2px #3D65A4;
            -webkit-box-shadow:0 0 0 #000,inset 0 2px 2px #3D65A4;
            box-shadow:0 0 0 #000,inset 0 2px 2px #3D65A4;
        }
        .buttonBar .button:focus {
            -moz-box-shadow:0 0 3px 1px #33A0E8,inset 0 0 3px 0 #35BFF4;
            -webkit-box-shadow:0 0 3px 1px #33A0E8,inset 0 0 3px 0 #35BFF4;
            box-shadow:0 0 3px 1px #33A0E8,inset 0 0 3px 0 #35BFF4;
        }
    </style>
    <script laguage="JavaScript">
        var notApproved = "<%=notApproved%>";
        var accessTokenCalled = false;

        function closeMe() {
            if (notApproved !== "true") {
                window.opener.DropboxZimlet.getAccessToken();
                accessTokenCalled = true;
            }
            window.close();
        }

        window.onbeforeunload = function() {
            if (notApproved !== "true" && !accessTokenCalled) {
                window.opener.DropboxZimlet.getAccessToken();
            }
        }
    </script>
</head>

<div class="header">
    <img width="135" height="34" src="https://www.dropbox.com/static/images/logo.png" alt="Dropbox home" id="db-logo">
</div>
<div class="body">
    <% if (!notApproved.equalsIgnoreCase("true")) {%>
    <strong>Congratulations!</strong><br/>  You have enabled a trusted connection with Dropbox.
    <% }
    else { %>
    You have <strong>not</strong> approved this trusted connection with Dropbox.
    <%}%>
</div>
<div class="buttonBar">
    <span class="button" onclick="closeMe()">Close</span>
    <!--<input type="button" value="Close" onclick="closeMe()"/>-->
</div>


</html>