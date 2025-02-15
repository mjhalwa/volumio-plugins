'use strict';

var libQ = require('kew');
var libNet = require('net');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;


// Define the ControllerVolspotconnect class
module.exports = ControllerVolspotconnect;

function ControllerVolspotconnect(context) {

	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}



ControllerVolspotconnect.prototype.onVolumioStart = function()
{
	var self= this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	    		self.createVOLSPOTCONNECTFile();
	return libQ.resolve();
}

ControllerVolspotconnect.prototype.getConfigurationFiles = function()
{
	return ['config.json'];
};
ControllerVolspotconnect.prototype.onPlayerNameChanged = function (playerName) {
	var self = this;

	self.onRestart();
};



// Plugin methods -----------------------------------------------------------------------------

ControllerVolspotconnect.prototype.startVolspotconnectDaemon = function() {
	var self = this;
	var defer=libQ.defer();

		exec("/usr/bin/sudo /bin/systemctl start volspotconnect.service", {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while starting VOLSPOTCONNECT: ' + error);
            defer.reject();
		}
		else {
			self.commandRouter.pushConsoleMessage('Volspotconnect Daemon Started');
            defer.resolve();
		}
	});

		return defer.promise;
};


ControllerVolspotconnect.prototype.onStop = function() {
	var self = this;

	self.logger.info("Killing Spotify-connect-web daemon");
		exec("/usr/bin/sudo /bin/systemctl stop volspotconnect.service", {uid:1000,gid:1000}, function (error, stdout, stderr) { 
	if(error){
	self.logger.info('Error in killing Voslpotconnect')
	}
	});

   return libQ.resolve();
};

ControllerVolspotconnect.prototype.onStart = function() {
    var self = this;

    var defer=libQ.defer();

  self.startVolspotconnectDaemon()
        .then(function(e)
        {
            setTimeout(function () {
                self.logger.info("Connecting to daemon");
                self.volspotconnectDaemonConnect(defer);
            }, 5000);
        })
        .fail(function(e)
        {
            defer.reject(new Error());
        });

	this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.rebuildVOLSPOTCONNECTAndRestartDaemon.bind(this));
	this.commandRouter.sharedVars.registerCallback('alsa.outputdevicemixer', this.rebuildVOLSPOTCONNECTAndRestartDaemon.bind(this));
	this.commandRouter.sharedVars.registerCallback('system.name', this.rebuildVOLSPOTCONNECTAndRestartDaemon.bind(this));


    return defer.promise;
};

//For future features....
ControllerVolspotconnect.prototype.volspotconnectDaemonConnect = function(defer) {
 var self = this;

 self.servicename = 'volspotconnect';
 self.displayname = 'volspotconnect';



 var nHost = 'localhost';
 var nPort = 4000;
 self.connVolspotconnectCommand = libNet.createConnection(nPort, nHost);
 self.connVolspotconnectStatus = libNet.createConnection(nPort, nHost, function() {
  defer.resolve();
 }); 
 
 self.connVolspotconnectCommand.on('error', function(err) {
  self.logger.info('Volspotcoonect status error:');
  self.logger.info(err);
  try {
   defer.reject();
  } catch (ecc) {}


 });
 self.connVolspotconnectStatus.on('error', function(err) {
  self.logger.info('Volspotconnect status error:');
  self.logger.info(err);

  try {
   defer.reject();
  } catch (ecc) {}
 });
};

// Volspotconnect stop
ControllerVolspotconnect.prototype.stop = function() {
	var self = this;
	

    self.logger.info("Killing Spotify-connect-web daemon");
	exec("/usr/bin/sudo /bin/systemctl stop volspotconnect.service", {uid:1000,gid:1000}, function (error, stdout, stderr) { 
	if(error){
self.logger.info('Error in killing Voslpotconnect')
	}
	});

   return libQ.resolve();
};


ControllerVolspotconnect.prototype.onRestart = function() {
	var self = this;
	//
};

ControllerVolspotconnect.prototype.onInstall = function() {
	var self = this;
	//Perform your installation tasks here
};

ControllerVolspotconnect.prototype.onUninstall = function() {
	var self = this;
   self.logger.info("Killing Spotify-connect-web daemon");
	exec("/usr/bin/sudo /bin/systemctl stop volspotconnect.service", {uid:1000,gid:1000}, function (error, stdout, stderr) { 
	if(error){
self.logger.info('Error in killing Voslpotconnect')
	}
	});

   return libQ.resolve();
};

ControllerVolspotconnect.prototype.getUIConfig = function() {
	var defer = libQ.defer();
	var self = this;
	var lang_code = this.commandRouter.sharedVars.get('language_code');

        self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
                __dirname+'/i18n/strings_en.json',
                __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {

uiconf.sections[0].content[0].value = self.config.get('username');
uiconf.sections[0].content[1].value = self.config.get('password');
uiconf.sections[0].content[2].value = self.config.get('bitrate');
uiconf.sections[0].content[3].value = self.config.get('familyshare');
            defer.resolve(uiconf);
            })
                .fail(function()
            {
                defer.reject(new Error());
        });

        return defer.promise;
};

ControllerVolspotconnect.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

ControllerVolspotconnect.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

ControllerVolspotconnect.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

// Public Methods ---------------------------------------------------------------------------------------

ControllerVolspotconnect.prototype.createVOLSPOTCONNECTFile = function () {
    var self = this;

    var defer=libQ.defer();


    try {

        fs.readFile(__dirname + "/volspotconnect.tmpl", 'utf8', function (err, data) {
            if (err) {
                defer.reject(new Error(err));
                return console.log(err);
            }
			var rate;
                if(self.config.get('bitrate')===true)
                    rate="320";
		else rate="128"
			var family;
		if(self.config.get('familyshare')===true)
		    family=""
		else family="#"

			var outdev = self.commandRouter.sharedVars.get('alsa.outputdevice');
			var smixer;
			var mixer;
			var slindex;
			var mindex;
			var smixer = self.commandRouter.sharedVars.get('alsa.outputdevicemixer')
				if (smixer != "None") {
					mixer = "--mixer " + "'"+ smixer +"'";
				} else { mixer = ""
				}
			var smindex = self.commandRouter.sharedVars.get('alsa.outputdevice');
				if (smixer == "SoftMaster") {
					mindex = "--mixer_device_index 1"
				}else if (smixer == "None") {	
					mindex = ""
				}else { mindex = "--mixer_device_index " + smindex;
				}
			var devicename = self.commandRouter.sharedVars.get('system.name');
			var hwdev ='plughw:' + outdev;
				if (outdev == "softvolume") {
					hwdev = "softvolume"
					}
		//	var hwdev = outdev;
			var  bitrate = self.config.get('bitrate');
			var bitratevalue = 'true';
			if (bitrate == false ) {
				bitratevalue = 'false';
			}

		var conf1 = data.replace("${username}", self.config.get('username'));
		var conf2 = conf1.replace("${password}", self.config.get('password'));
		var conf3 = conf2.replace("${rate}", rate);
		var conf4 = conf3.replace("${devicename}",devicename);
		var conf5 = conf4.replace("${outdev}", hwdev);
		var conf6 = conf5.replace("${mixer}", mixer);
		var conf7 = conf6.replace("${mixind}", mindex);
		var conf8 = conf7.replace("${familyshare}", family);
		var conf9 = conf8.replace("${devicename}",devicename);
			
	            fs.writeFile("/data/plugins/music_service/volspotconnect/spotify-connect-web/startconnect.sh", conf9, 'utf8', function (err) {
                if (err)
                    defer.reject(new Error(err));
                else defer.resolve();
            });
            
        });


    }
    catch (err) {


    }

    return defer.promise;

};

ControllerVolspotconnect.prototype.createASOUNDFile = function () {
    var self = this;
    var outdev = self.commandRouter.sharedVars.get('alsa.outputdevice');
    var defer = libQ.defer();
    if (outdev = 'softvolume') {
    console.log(outdev)
        fs.copy('/etc/asound.conf', '/data/plugins/music_service/volspotconnect/spotify-connect-web/etc/asound.conf', 'utf8', function (err) {
            if (err) return console.error(err);
            console.log("copied with success")
               })
           };
 
};


ControllerVolspotconnect.prototype.saveVolspotconnectAccount = function (data) {
    var self = this;

    var defer = libQ.defer();

	self.config.set('username', data['username']);
	self.config.set('password', data['password']);
	self.config.set('bitrate', data['bitrate']);
	self.config.set('familyshare', data['familyshare']);
	self.rebuildVOLSPOTCONNECTAndRestartDaemon()
        .then(function(e){
            self.commandRouter.pushToastMessage('success', "Configuration update", 'The configuration of Volspotconnect has been successfully updated');
            defer.resolve({});
        })
        .fail(function(e)
        {
            defer.reject(new Error());
        })


    return defer.promise;

};

ControllerVolspotconnect.prototype.rebuildVOLSPOTCONNECTAndRestartDaemon = function () {
    var self=this;
    var defer=libQ.defer();
    self.createASOUNDFile()	
console.log('toto')
    self.createVOLSPOTCONNECTFile()
        .then(function(e)
        {
            var edefer=libQ.defer();
            exec("/usr/bin/sudo /bin/systemctl restart volspotconnect.service",{uid:1000,gid:1000}, function (error, stdout, stderr) {
                edefer.resolve();
            });
            return edefer.promise;
        })
        .then(self.startVolspotconnectDaemon.bind(self))
        .then(function(e)
        {
        self.commandRouter.pushToastMessage('success', "Configuration update", 'Volumio Spotify Connect has been successfully updated');
   defer.resolve({});
        });

    return defer.promise;
}
