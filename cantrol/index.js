'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


module.exports = ainterface;
function ainterface(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}



ainterface.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

    return libQ.resolve();
}

ainterface.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();

	self.loadAmpDefinitions()
    //initialize list of serial devices available to the system
    //update Volume Settings and announce the updated settings to Volumio
    .then(_ => self.alsavolume(50))
    .then(_ => self.updateVolumeSettings())
	// Once the Plugin has successfull started resolve the promise
    .then(function(){
            self.logger.info('[ainterface] onStart: successfully started plugin');
            defer.resolve();
    })
    .fail(err => {
        self.logger.error('[ainterface] onStart: FAILED to start plugin: ' + err);
        defer.reject(err);
    })
	// self.commandRouter.volumioupdatevolume(self.getVolumeObject());

	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

    return defer.promise;
};


// Load Amp Definition file and initialize the list of Vendor/Amp for settings
ainterface.prototype.loadAmpDefinitions = function() {
    var self = this;

    //var ampDefinitionFile = this.commandRouter.pluginManager.getConfigurationFile(this.context,'ampCommands.json');
    //self.ampDefinitions = new(require('v-conf'))();
    //self.ampDefinitions.loadFile(ampDefinitionFile);
    //if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadAmpDefinitions: loaded AmpDefinitions: ' + JSON.stringify(self.ampDefinitions));
    //Generate list of Amp Names as combination of Vendor + Model
    //self.ampVendorModelList = [];
    //for (var n = 0; n < self.ampDefinitions.data.amps.length; n++)
   // {
   //     self.ampVendorModelList.push(self.ampDefinitions.data.amps[n].vendor + ' - ' + self.ampDefinitions.data.amps[n].model);
    //};
    //if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadAmpDefinitions: loaded AmpDefinitions for ' + self.ampVendorModelList.length + ' Amplifiers.');
    return libQ.resolve();
};

ainterface.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

var data = { enabled: false, setvolumescript: '', getvolumescript: '' };
self.commandRouter.updateVolumeScripts(data);


    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

ainterface.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

ainterface.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {


            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};

ainterface.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

ainterface.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

ainterface.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

ainterface.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


ainterface.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

ainterface.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    //self.commandRouter.logger.info(curUri);
    var response;


    return response;
};



// Define a method to clear, add, and play an array of tracks
ainterface.prototype.clearAddPlayTrack = function(track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ainterface::clearAddPlayTrack');

	self.commandRouter.logger.info(JSON.stringify(track));

	return self.sendSpopCommand('uplay', [track.uri]);
};

ainterface.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ainterface::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
ainterface.prototype.stop = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ainterface::stop');


};

// Spop pause
ainterface.prototype.pause = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ainterface::pause');


};

// Get state
ainterface.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ainterface::getState');


};

//Parse state
ainterface.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ainterface::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
ainterface.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ainterface::pushState');

	return self.commandRouter.servicePushState(state, self.servicename);
};


ainterface.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI

	return defer.promise;
};

ainterface.prototype.getAlbumArt = function (data, path) {

	var artist, album;

	if (data != undefined && data.path != undefined) {
		path = data.path;
	}

	var web;

	if (data != undefined && data.artist != undefined) {
		artist = data.artist;
		if (data.album != undefined)
			album = data.album;
		else album = data.artist;

		web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
	}

	var url = '/albumart';

	if (web != undefined)
		url = url + web;

	if (web != undefined && path != undefined)
		url = url + '&';
	else if (path != undefined)
		url = url + '?';

	if (path != undefined)
		url = url + 'path=' + nodetools.urlEncode(path);

	return url;
};





ainterface.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

ainterface.prototype._searchArtists = function (results) {

};

ainterface.prototype._searchAlbums = function (results) {

};

ainterface.prototype._searchPlaylists = function (results) {


};

ainterface.prototype._searchTracks = function (results) {

};

ainterface.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

// Handle go to artist and go to album function

     return defer.promise;
};







//update the volumio Volume Settings, mainly makes this an Override plugin
ainterface.prototype.updateVolumeSettings = function() {
	var self = this;
    var defer = libQ.defer();

    //Prepare the data for updating the Volume Settings
    //first read the audio-device information, since we won't configure this 
        var volSettingsData = {
            'pluginType': 'system_controller',
            'pluginName': 'ainterface',
            'volumeOverride': true
        };
        volSettingsData.device = self.commandRouter.executeOnPlugin('system_controller', 'alsa_controller', 'getConfigParam', 'outputdevice');
        volSettingsData.name = "testi";
//self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getAlsaCards', '')[volSettingsData.device].name;
        volSettingsData.devicename = 'CXA80_JJ';
        volSettingsData.mixer = 'CXA80_J3';
        volSettingsData.maxvolume = 100;
        volSettingsData.volumecurve = '';
        volSettingsData.volumesteps = 1;
        volSettingsData.currentmute = 0;
        self.commandRouter.volumioUpdateVolumeSettings(volSettingsData)
        .then(resp => {
            self.logger.info("[ainterface] updateVolumeSettings: " + JSON.stringify(volSettingsData + ' ' + resp));
            defer.resolve();
        })
        .fail(err => {
            self.logger.error("[ainterface] updateVolumeSettings: volumioUpdateVolumeSettings failed:" + err );
            defer.reject(err);
        })
    return defer.promise;
};


//override the alsavolume function to send volume commands to the amp
ainterface.prototype.alsavolume = function (VolumeInteger) {
	var self = this;
    var defer = libQ.defer();
    
    self.logger.info('[ainterface] alsavolume: Set volume "' + VolumeInteger + '"');
        switch (VolumeInteger) {
            case 'mute':
            // Mute
                     self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send dedicated muteOn.');
                    //defer.resolve(self.waitForAcknowledge('mute'));
                    self.sendCommand('muteOn');
                
                break;
            case 'unmute':
            // Unmute (inverse of mute)
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send dedicated muteOff.');
                    defer.resolve(self.waitForAcknowledge('mute'));
                    self.sendCommand('muteOff');
                break;
            case 'toggle':
            // Toggle mute
                self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send muteToggle.');
                self.sendCommand('muteToggle');
                break;
            case '+':
            	self.logger.info('[SERIALAMPCONTROLLER] alsavolume: increase volume by single step.');
               self.sendCommand('volUp');
                break;
            case '-':
				self.logger.info('[SERIALAMPCONTROLLER] alsavolume: decrease volume by single step.');
				self.sendCommand('volDown');
            break;
            default:
            //set volume to integer
                self.logger.info('[SERIALAMPCONTROLLER] alsavolume: set volume to integer value.');
                if (VolumeInteger>50) {
					self.sendCommand('volUp');
                } else if (VolumeInteger<50){
					self.sendCommand('volDowm');
                }
                break;   
        };
        defer.resolve();
    return defer.promise;
};


ainterface.prototype.getVolumeObject = function() {
	// returns the current amplifier settings in an object that volumio can use
		var volume = {};
		var self = this;
	
		volume.mute = 0;
		volume.vol=50;
		volume.disableVolumeControl = false;
		if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] getVolumeObject: ' + JSON.stringify(volume));
	
		return volume;
	};
	
	ainterface.prototype.volumioupdatevolume = function() {
		var self = this;
		return self.commandRouter.volumioupdatevolume(self.getVolumeObject());
	};
	
	ainterface.prototype.retrievevolume = function () {
		var self = this;
		return self.getVolumeObject();
	}
	

	//send commands to the amp
ainterface.prototype.sendCommand  = function(...cmd) {
    var self = this;
    var defer = libQ.defer();

    var cmdString = '';
    self.logger.info("[ainterface] sendCommand: send " + cmd);
    switch (cmd[0]) {
        case  "powerOn": 
            cmdString = "Power_On";
            break;
        case  "powerToggle": 
            cmdString = "Power_Toggle";
            break;
        case  "volUp": 
            cmdString = "Volume_Up"
            break;
        case  "volDown": 
            cmdString = "Volume_Down";
            break;
        case  "muteToggle": 
            cmdString = "Mute_Toggle"
            break;
        case  "muteOn": 
            cmdString = "Mute_On";
            break;
        case  "muteOff": 
            cmdString = "Mute_Off";
            break;
        //case  "source": 
            // cmdString = cmdString + self.selectedAmp.commands.source;
            // var count = (cmdString.match(/#/g) || []).length;
          //  cmdString =  self.selectedAmp.sourceCmd[self.selectedAmp.sources.indexOf(cmd[1])];
            //break;
        default:
            break;
    }
	execSync('/usr/bin/python /home/volumio/pi_hifi_ctrl/ca_amp_ctrl.py '+cmdString, { uid: 1000, gid: 1000, encoding: 'utf8' });

            defer.resolve();

    return defer.promise;
}

