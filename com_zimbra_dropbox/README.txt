#Dropbox Zimlet
This is a zimlet for the Zimbra Web Collaboration Suite (http://www.zimbra.com) that provides integration with Dropbox (http://dropbox.com).  This zimlet makes use of the Dropbox Chooser (https://www.dropbox.com/developers/chooser) and the Dropbox App folder API (https://www.dropbox.com/developers).

#Requirements
In order to use this zimlet you need to create an account on Dropbox and register an app.  Registering will get you app keys for both the Chooser API and the App folder API.  
In order to get your Dropbox app enabled for production you'll need to go through the Dropbox approval process.  The approval process requires that Dropbox verify your app through an account they can login to, screenshots or screencasts.

Currently this zimlet only works with a Zimbra 8 install for the Ajax client.

#Installation
- To install this zimlet create a new folder on your computer and unzip the zimlet zipfile.
- You'll then register the keys in the config_template.xml:
 <property name="ChooserAppKey">YOUR VALUE</property>
 <property name="ZimbraAppKey">YOUR VALUE</property>
 <property name="ZimbraAppSecret">YOUR VALUE</property>
- Then create a new zipfile containing all the files you previously unzipped in a zipfile called com_zimbra_dropbox.zip
- Deploy the new zipfile on your Zimbra 8 server
 
#What it does
The Dropbox Zimlet provides two features -- Attach to a message and Save an attachment.

#Attach
This zimlet makes use of the Dropbox Chooser API to "attach" a file from Dropbox to a message you are composing. I use 
quotes around attach because it's not an attachment but a link to the file.  To enable attach from dropbox, just compose a new message and choose "Dropbox" from the Attach dropdown.  When you click Dropbox it will open a new window and then ask the end user to login to their Dropbox account if they are not already logged in through the website. In the new window the user can navigate through the folder structure for the file they wish to attach. This works for both HTML and plain text compose.

#Save to Dropbox
The other feature this zimlet provides is "Save to Dropbox".  When the zimlet is enabled users will see a "Save to Dropbox" link next to attachments.  Clicking the "Save to Dropbox" the first time will open a new window and require the end user to accept the authentication.  The save process use oAuth authentication.  Once the user has accepted the app, clicking "Save to Dropbox" will save the file to a the "sandbox" folder for the app.  Dropbox sandbox folder is set when you create your app under the Dropbox dashboard.  For example, if I name my app "Zimbra", then clicking "Save to Dropbox" will save the file to /Apps/Zimbra in the user's Dropbox account.  A toast message will display after the user has completed the action.

#How you can help
The code is open source.  You can help improve it by filing issues, contributing to translations and code improvements.
