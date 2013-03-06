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

/**
 * Constructor.
 *
 * @author Jeff Wagner
 */
function com_zimbra_dropbox_HandlerObject() {
	
};

com_zimbra_dropbox_HandlerObject.prototype = new ZmZimletBase();
com_zimbra_dropbox_HandlerObject.prototype.constructor = com_zimbra_dropbox_HandlerObject;

var DropboxZimlet = com_zimbra_dropbox_HandlerObject;

DropboxZimlet.prototype.init = function() {
	this._loadDropboxChooser();
	this._zimbraAppSecret = this.getConfig("ZimbraAppSecret");
	appCtxt.cacheSet("zimbraDropboxAppSecret", this._zimbraAppSecret);
	this._zimbraAppKey = this.getConfig("ZimbraAppKey");
	appCtxt.cacheSet("zimbraDropboxAppKey", this._zimbraAppKey);
	
	if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
		AjxPackage.require({name:"MailCore", callback:new AjxCallback(this, this.addAttachmentHandler)});
	}
	DropboxZimlet.downloadUrl = this.getResource("dropBoxDownload.jsp");
	DropboxZimlet.errorSaving = this.getMessage("errorSaving");
	DropboxZimlet.savingFile = this.getMessage("savingFile");
	DropboxZimlet.savedFile = this.getMessage("savedFile");
	DropboxZimlet.appsFolder = this.getMessage("appsFolder");
	//see if metadata is already set for app
	var md = new ZmMetaData(appCtxt.getActiveAccount());
	md.get("zimbraDropBox", null, this._handleDropboxMetadata.bind(this), this._handleDropboxErrorMetadata.bind(this));	
};

DropboxZimlet.prototype.addAttachmentHandler = function()
{
	this._msgController = AjxDispatcher.run("GetMsgController");
	var viewType = appCtxt.getViewTypeFromId(ZmId.VIEW_MSG);
	this._msgController._initializeView(viewType);

	for (var mimeType in ZmMimeTable._table ) {
		this._msgController._listView[viewType].addAttachmentLinkHandler(mimeType,"Dropbox",this.addDropboxLink);
	}
	
};

DropboxZimlet.prototype.addDropboxLink = 
function(attachment) {
	var html =
			"<a href='#' class='AttLink' style='text-decoration:underline;' " +
					"onClick=\"DropboxZimlet.saveAttachment('" + attachment.mid + "','" + attachment.part + "','" + attachment.label+ "', '" + attachment.ct + "')\">"+
					"Dropbox" +
					"</a>";

	return html;
};

DropboxZimlet.prototype.initializeAttachPopup =
function(menu, controller) {
	var mi = controller._createAttachMenuItem(menu, "Dropbox",
			new AjxListener(this, this.showDropboxChooser ));
};

DropboxZimlet.prototype.showDropboxChooser=
function() {
	var options = {
		linkType: "preview",
	    success: function(files) {
		    var view = appCtxt.getCurrentView();
		    var editor = view.getHtmlEditor();
		    //editor.focus();
		    var editorContent =  editor.getContent();
		    var isHtml = view && view.getComposeMode() === DwtHtmlEditor.HTML;
		    if (isHtml) {
			    var thumbnail = files[0].thumbnails && files[0].thumbnails["64x64"] ? files[0].thumbnails["64x64"] : files[0].icon;

			    var div = '<div style="background-color:rgb(245, 245, 245); padding:10px 14px; margin-right:10px; color:rgb(34, 34, 34); '; 
                div+='font-family:arial; font-style:normal; font-weight:bold; font-size:13px; cursor:default; border:1px solid rgb(221, 221, 221); float:left;">';
				div+='<a href="' + files[0].link + '" target="_blank"><img style="padding-bottom:7px; border:none;" width="64" height="64" src="' + thumbnail + '"></a>';
				div+='<div dir="ltr" title="File Name" style="color:rgb(17, 85, 204); text-decoration:initial; vertical-align:bottom;">';
			    div+='<a href="' + files[0].link + '" target="_blank" style=" display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-decoration:none; text-align:center; cursor:pointer;padding:1px 0; border:none; max-width:200px;">' + files[0].name + '</div></a>';
				div+='</div><div style="clear:both"><br/></div>';
  
			    var ed = editor.getEditor();
			    editor.restoreFocus(ed);

			    //tinymce modifies the source when using mceInsertContent
			    //ed.execCommand('mceInsertContent', false, html.join(""), {skip_undo : 1});
			    ed.execCommand('mceInsertRawHTML', false, div, {skip_undo : 1});
		    }
		    else {
			    view.getHtmlEditor().setContent(editorContent + "\n" + files[0].name + " : " + files[0].link + "\n");
		    }
	    },
		cancel: function() {
			
		},
		appKey: this.getConfig("ChooserAppKey")
	};
	Dropbox.init(options);
	Dropbox.choose(options);
};

DropboxZimlet.prototype.getRequestToken = 
function() {
	//POST https://api.dropbox.com/1/oauth/request_token
	//Your HTTP request should have the following header:
	//Authorization: OAuth oauth_version="1.0", oauth_signature_method="PLAINTEXT", oauth_consumer_key="<app-key>", 
	// oauth_signature="<app-secret>&"
	var headers = {"Authorization": "OAuth"};
	var urlParams = "oauth_consumer_key=" + this._zimbraAppKey + "&oauth_signature_method=PLAINTEXT&oauth_version=1.0&oauth_signature=" + this._zimbraAppSecret + "%26";
	AjxRpc.invoke(null, "https://api.dropbox.com/1/oauth/request_token?" + urlParams, headers, this._handleRequestToken.bind(this), AjxRpcRequest.HTTP_POST);
};

DropboxZimlet.prototype._handleRequestToken = 
function(result) {
	//The response body will be a url-encoded string:
	//oauth_token=<request-token>&oauth_token_secret=<request-token-secret>
	if (result && result.text) {
		var params = result.text.split("&");
		if (params && params.length >= 2) {
			p1 = params[0].split("=");
			if (p1[0] === "oauth_token") {
				this._oauthToken = p1[1];
			}
			else if (p1[0] === "oauth_token_secret") {
				this._oauthTokenSecret = p1[1];
			}
			p2 = params[1].split("=");
			if (p2[0] === "oauth_token_secret") {
				this._oauthTokenSecret = p2[1];
			}
			else if(p2[0] === "oauth_token") {
				this._oauthToken = p2[1];
			}
			//save request token to cache so we can use it to get access token
			appCtxt.cacheSet("dropBoxRequestToken", this._oauthToken);
			appCtxt.cacheSet("dropBoxTokenSecret", this._oauthTokenSecret);
		}
		this.authorizeZimbra();
	}
};

DropboxZimlet.prototype.authorizeZimbra = 
function() {
	//To do this, send the user's browser to:
	//https://www.dropbox.com/1/oauth/authorize?oauth_token=<request-token>&oauth_callback=<callback-url>
	var callbackUrl = document.location.protocol + "//" + document.location.host;
	var width = 1000,
	height = 600,
	left = parseInt((screen.availWidth / 2) - (width / 2)),
	top = parseInt((screen.availHeight / 2) - (height / 2)),
	windowFeatures = "width=" + width + ",height=" + height + ",status,resizable,left=" + left + ",top=" + top + "screenX=" + left + ",screenY=" + top,
	url = "https://www.dropbox.com/1/oauth/authorize?oauth_token=" + this._oauthToken + "&oauth_callback=" + callbackUrl + this.getResource("dropBoxHandler.jsp"),
	win = window.open(url, "dropboxWindow", windowFeatures);

};

DropboxZimlet.prototype._handleDropboxMetadata = 
function(result) {	
	var response = result.getResponse();
	if(response && response.BatchResponse && response.BatchResponse.GetMailboxMetadataResponse) {
		response = response.BatchResponse.GetMailboxMetadataResponse;
	} else {
		return;
	}
	try {
		if (response && response.length && response[0].meta && response[0].meta[0]._attrs) {
			this._oauthToken = response[0].meta[0]._attrs["dropBoxOauthToken"];
			this._oauthSecret = response[0].meta[0]._attrs["dropBoxOauthSecret"];
			appCtxt.cacheSet("dropBoxOauthToken", this._oauthToken);
			appCtxt.cacheSet("dropBoxOauthSecret", this._oauthSecret);
		}
		
	} catch(ex) {
		return;
	}
};

DropboxZimlet.prototype._handleDropboxErrorMetadata = 
function(result) {
	alert("error");
	return;	
};

DropboxZimlet.prototype.clearMetadata = 
function() {
	var md = new ZmMetaData(appCtxt.getActiveAccount());
	appCtxt.cacheSet("dropBoxOauthToken", null);
	appCtxt.cacheSet("dropBoxOauthSecret", null);
	md.set("zimbraDropBox", null, null, null);
};

DropboxZimlet._handleAccessToken = 
function(result) {
	/*
	 The response body will be a url-encoded string:
	 oauth_token=<access-token>&oauth_token_secret=<access-token-secret>&uid=<user-id>
	 */
	var oauthToken = null;
	var oauthTokenSecret = null;
	
	if (result && result.text) {
		var params = result.text.split("&");
		if (params && params.length >= 2) {
			var p1 = params[0].split("=");
			if (p1[0] === "oauth_token") {
				oauthToken = p1[1];
			}
			else if (p1[0] === "oauth_token_secret") {
				oauthTokenSecret = p1[1];
			}
			var p2 = params[1].split("=");
			if (p2[0] === "oauth_token_secret") {
				oauthTokenSecret = p2[1];
			}
			else if(p2[0] === "oauth_token") {
				oauthToken = p2[1];
			}
			var p3 = params[2].split("=");
			if (p3[0] === "oauth_token_secret") {
				oauthTokenSecret = p3[1]	
			}
			else if(p3[1] === "oauth_token") {
				oauthToken = p3[1];
			}
			//save token and secret long term
			var md = new ZmMetaData(appCtxt.getActiveAccount());
			var keyVal = [];
			keyVal["dropBoxOauthToken"] = oauthToken;
			keyVal["dropBoxOauthSecret"] = oauthTokenSecret;
			appCtxt.cacheSet("dropBoxOauthToken", oauthToken);
			appCtxt.cacheSet("dropBoxOauthSecret", oauthTokenSecret);
			md.set("zimbraDropBox", keyVal, null, null);
		}		
	}
};

DropboxZimlet.getAccessToken = 
function() {
	/*
	 convert your request token into an access token:

	 POST https://api.dropbox.com/1/oauth/access_token

	 This token is what lets you make calls to the Dropbox API. Your HTTP request should have the following header:

	 Authorization: OAuth oauth_version="1.0", oauth_signature_method="PLAINTEXT", oauth_consumer_key="<app-key>", 
	 oauth_token="<request-token>", oauth_signature="<app-secret>&<request-token-secret>"
	 */
	var requestTokenSecret = appCtxt.cacheGet("dropBoxTokenSecret");
	var requestToken = appCtxt.cacheGet("dropBoxRequestToken");
	var zimbraAppKey = appCtxt.cacheGet("zimbraDropboxAppKey");
	var zimbraAppSecret = appCtxt.cacheGet("zimbraDropboxAppSecret");
	var headers = {"Authorization": "OAuth"};
	var urlParams = "oauth_consumer_key=" + zimbraAppKey + "&oauth_signature_method=PLAINTEXT&oauth_version=1.0&oauth_token=" + requestToken + "&oauth_signature=" + zimbraAppSecret + "%26" + requestTokenSecret;
	AjxRpc.invoke(null, "https://api.dropbox.com/1/oauth/access_token?" + urlParams, headers, this._handleAccessToken.bind(this), AjxRpcRequest.HTTP_POST);

};

DropboxZimlet.saveAttachment = 
function(id, part, name, contentType) {
	//https://api-content.dropbox.com/1/files_put/sandbox/<path>?param=val
	/*
	 Authorization: OAuth oauth_version="1.0", oauth_signature_method="PLAINTEXT", oauth_consumer_key="<app-key>", oauth_token="<access-token>, oauth_signature="<app-secret>&<access-token-secret>"
	 */
	
	var zimbraAppKey = appCtxt.cacheGet("zimbraDropboxAppKey");
	var zimbraAppSecret = appCtxt.cacheGet("zimbraDropboxAppSecret");
	var oauthToken = appCtxt.cacheGet("dropBoxOauthToken");
	var oauthSecret = appCtxt.cacheGet("dropBoxOauthSecret");
	
	if (!oauthToken || !oauthSecret) {
		var dBoxZimlet = appCtxt.getZimletMgr().getZimletByName("com_zimbra_dropbox").handlerObject;
		dBoxZimlet.getRequestToken();
		return;
	}
	name = escape(name);
	var body = "user=" + appCtxt.getUsername() + "&fileName=" + name + "&id=" + id + "&part=" + part + "&ct=" + contentType + "&oauth_consumer_key=" + zimbraAppKey + "&oauth_signature_method=PLAINTEXT&oauth_version=1.0&oauth_token=" + oauthToken + "&oauth_signature=" + zimbraAppSecret + "&appSecret=" + oauthSecret;
	appCtxt.getAppController().setStatusMsg(DropboxZimlet.savingFile, ZmStatusView.LEVEL_INFO);
	AjxRpc.invoke(null, DropboxZimlet.downloadUrl +"?" + body, null, this._handleSaveAttachment.bind(this), AjxRpcRequest.HTTP_GET);
};

DropboxZimlet._handleSaveAttachment = 
function(result) {
	if (!result) {
		appCtxt.getAppController().setStatusMsg(DropboxZimlet.errorSaving, ZmStatusView.LEVEL_CRITICAL);
		return;
	}
	var jsonObj;
	try {
		jsonObj = eval("(" + result.text + ")");
	}
	catch (e) {
		appCtxt.getAppController().setStatusMsg(DropboxZimlet.errorSaving, ZmStatusView.LEVEL_CRITICAL);
		return;
	}
	if (jsonObj && jsonObj.error && jsonObj.error === "Unauthorized") {
		appCtxt.getAppController().setStatusMsg(DropboxZimlet.errorSaving, ZmStatusView.LEVEL_CRITICAL);
		var dBoxZimlet = appCtxt.getZimletMgr().getZimletByName("com_zimbra_dropbox").handlerObject;
		dBoxZimlet.clearMetadata();
		dBoxZimlet.getRequestToken();
	}	
	else if (result && result.success) {
		//var path = jsonObj && jsonObj.path;  //We could display full name
		appCtxt.getAppController().setStatusMsg(DropboxZimlet.savedFile, ZmStatusView.LEVEL_INFO);
	}
	return;
};

// Loads the dropbox api
DropboxZimlet.prototype._loadDropboxChooser = function() {
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.src = "https://www.dropbox.com/static/api/1/dropbox.js";
	script.id = "dropbox_chooser";
	document.body.appendChild(script);
};
