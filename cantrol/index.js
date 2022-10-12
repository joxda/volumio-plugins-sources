'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000');
//declare global status variable
var status = 'na';


module.exports = cantrol;
function cantrol(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

    this.debug = true;
    // Setup Debugger
    self.logger.CAdebug = function (data, level) {
        if(self.debug)
        {
        switch (level) {
            case "info":
                self.logger.info('[CAntrol Debug] ' + data);
                break;
            case "warn":
                self.logger.warn('[CAntrol Debug] ' + data);
                break;
            case "debug":
                self.logger.debug('[CAntrol Debug] ' + data);
            default:
                break;
            }
        };
        if (level == "error")
        {
            self.logger.error('[CAntrol Debug] ' + data);
        }
    }
}

cantrol.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	let rdata = fs.readFileSync(__dirname+"/config.json");
        self.configJSON = JSON.parse(rdata);

    return libQ.resolve();
}

cantrol.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();
    self.control = true;
    self.RA5_del = 889
    self.outPin = 17;
    self.repeat = 1;
    
	self.loadAmpDefinitions()
    //initialize list of serial devices available to the system
    //update Volume Settings and announce the updated settings to Volumio
    .then(_ => self.alsavolume(50))
    .then(_ => self.updateVolumeSettings())
	// Once the Plugin has successfull started resolve the promise
    .then(function(){
            self.logger.CAdebug('onStart: successfully started plugin','info');
            defer.resolve();
    })
    .fail(err => {
        self.logger.CAdebug(err,'error');
        defer.reject(err);
    })
	// self.commandRouter.volumioupdatevolume(self.getVolumeObject());


    // read and parse status once
    socket.emit('getState','');
    socket.once('pushState', self.parseStatus.bind(self));

    // listen to every subsequent status report from Volumio
    // status is pushed after every playback action, so we will be
    // notified if the status changes
    socket.on('pushState', self.parseStatus.bind(self));

	// Once the Plugin has successfull started resolve the promise
    return defer.promise;
};


// Load Amp Definition file and initialize the list of Vendor/Amp for settings
cantrol.prototype.loadAmpDefinitions = function() {
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

cantrol.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

//var data = { enabled: false, setvolumescript: '', getvolumescript: '' };
//self.commandRouter.updateVolumeScripts(data);


    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();
    return defer.promise;
};

cantrol.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};

cantrol.prototype.sendNumCom = function (com)
{
    var self = this;
    // execute(pin, device, command, toggle, repeat)
    self.logger.CAdebug('/usr/bin/python /data/plugins/system_controller/cantrol/pygpio.py '+self.configJSON["output_pin"]+' '+self.configJSON["devNum"]+' '+com+' '+self.control+' '+self.configJSON["repeat"]+' '+self.configJSON["half_period"],'info');
    execSync('/usr/bin/python /data/plugins/system_controller/cantrol/pygpio.py '+self.configJSON["output_pin"]+' '+self.configJSON["devNum"]+' '+com+' '+self.control+' '+self.configJSON["repeat"]+' '+self.configJSON["half_period"], { uid: 1000, gid: 1000, encoding: 'utf8' });
    // when settings are loaded use something like parseInt
}
	//send commands to the amp
    cantrol.prototype.sendCommand  = function(...cmd) {
        var self = this;
        var defer = libQ.defer();
    
        var cmdString = '';
        self.logger.CAdebug("sendCommand: send " + cmd,'info');


        if (self.configJSON)
        {
            let cmdo = self.configJSON[cmd];
            // CHECK THAT IT IS VALID
            
            defer.resolve();
        }
        else {
            defer.fail("no amp settings active");
        }
        
        return defer.promise;
    }
    
    

// Configuration Methods -----------------------------------------------------------------------------
cantrol.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then((uiconf) => {
    	    var files = fs.readdirSync(__dirname+"/ampConfs").filter(fn => fn.endsWith(".json"));

            self.ampName = self.configJSON['name'];
	    self.logger.CAdebug(self.ampName,"error");
            var opts = [];

            var value = {};
            for (let i=1; i <= files.length; i++)
            {
                self.logger.CAdebug(files[i-1],"error");
                let rawdata = fs.readFileSync(__dirname+"/ampConfs/"+files[i-1]);
                let ampJson = JSON.parse(rawdata);
                self.logger.CAdebug(JSON.stringify(ampJson),"error");
		self.logger.CAdebug(self.ampName,"error");
                opts.push( { "value": i, "label": ampJson["name"]} );
                if(self.ampName == ampJson["name"])
                {
                    value = {"value": i, "label": ampJson["name"]};
                    self.configJSON = ampJson;
                }
            }
            opts.push( { "value": files.length+1, "label": "TRANSLATE.CONFIG"+"..."} );

            uiconf["sections"][0].content[0] = {
                "id": "amplifier",
                "element": "select",
                "doc": "TRANSLATE.AMPLIFIER_MODEL_DOC",
                "label": "TRANSLATE.AMPLIFIER_MODEL",
                "value": value,
                "options": opts
            }

            //for (let i=0; i < self.ampJSON["Commands"].length; i++)
            for (const [key, value] of Object.entries(self.configJSON["Commands"])) 
            {
                let btn = 	{	  "id":key,
                    "element": "button",
                    "label": key,
                    "doc": "TRANSLATE.TEST_BUTTON",
                    "onClick": {"type":"emit", "message":"callMethod", "data":{"endpoint":"system_controller/cantrol","method":"sendNumCom","data":value}}
                };
                uiconf["sections"][0].content.push(btn);
            }
            for (let i=0; i < self.configJSON["Sources"].length; i++)
            {
                let key = self.configJSON["Sources"][i]["name"];
                let value = self.configJSON["Sources"][i]["code"];
                let btn = 	{	  "id":key,
                    "element": "button",
                    "label": key,
                    "doc": "TRANSLATE.SOURCES",
                    "onClick": {"type":"emit", "message":"callMethod", "data":{"endpoint":"system_controller/cantrol","method":"sendNumCom","data":value}}
                };
                uiconf["sections"][0].content.push(btn);
            }
            for (let i=0; i < self.configJSON["Miscellaneous"].length; i++)
            {
                let key = self.configJSON["Miscellaneous"][i]["name"];
                let value = self.configJSON["Miscellaneous"][i]["code"];
                let btn = 	{	  "id":key,
                    "element": "button",
                    "label": key,
                    "doc": "TRANSLATE.TEST_BUTTON",
                    "onClick": {"type":"emit", "message":"callMethod", "data":{"endpoint":"system_controller/cantrol","method":"sendNumCom","data":value}}
                };
                uiconf["sections"][0].content.push(btn);
            }

            for (const [key, value] of Object.entries(self.configJSON["Commands"]))
                {
                    let txt = 	{	  "id":key+"TXT",
                        "element": "input",
                        "label": key,
                        "doc": "TRANSLATE.CONFIGURE",
                        "value": value,
                        "visibleIf": {"field": "amplifier", "value": files.length+1},
                        "attributes": [
                            {"type": "number"}, {"min": 0}, {"max":127}
                          ]
                };
                    uiconf["sections"][0].content.push(txt);
                }
                for (let i=0; i < self.configJSON["Sources"].length; i++)
                {
                    let key = self.configJSON["Sources"][i]["name"];
                    let value = self.configJSON["Sources"][i]["code"];
                    let txt = 	{	  "id":key+"TXT",
                        "element": "input",
                        "label": key,
                        "doc": "TRANSLATE.CONFIGURE",
                        "value": value,
                        "visibleIf": {"field": "amplifier", "value": files.length+1 }                    };
                    uiconf["sections"][0].content.push(txt);
                }
                for (let i=0; i < self.configJSON["Miscellaneous"].length; i++)
                {
                    let key = self.configJSON["Miscellaneous"][i]["name"];
                    let value = self.configJSON["Miscellaneous"][i]["code"];
                    let txt = 	{	  "id":key+"TXT",
                        "element": "input",
                        "label": key,
                        "doc": "TRANSLATE.CONFIGURE",
                        "value": value,
                        "visibleIf": {"field": "amplifier", "value": files.length+1 }                    };
                    uiconf["sections"][0].content.push(txt);
                }
fs.writeFile(__dirname+"test.txt", JSON.stringify(uiconf,null,2), function(err) {
    if (err) {
        console.log(err);
    }
});
            defer.resolve(uiconf);
	   } )
        .fail((e) => 
        {
            self.logger.error('Could not fetch CAntrol UI Configuration: ' + e);
            defer.reject(new Error());
        });

    return defer.promise;
};

cantrol.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

cantrol.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

cantrol.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

cantrol.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


cantrol.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
    //this.commandRouter.volumioAddToBrowseSources(data);
};

cantrol.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    //self.commandRouter.logger.info(curUri);
    var response;


    return response;
};



// Define a method to clear, add, and play an array of tracks
cantrol.prototype.clearAddPlayTrack = function(track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrol::clearAddPlayTrack');

	self.commandRouter.logger.info(JSON.stringify(track));

	return self.sendSpopCommand('uplay', [track.uri]);
};

cantrol.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrol::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
cantrol.prototype.stop = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrol::stop');


};

// Spop pause
cantrol.prototype.pause = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrol::pause');


};

// Get state
cantrol.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrol::getState');


};

//Parse state
cantrol.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrol::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
cantrol.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrol::pushState');

	return self.commandRouter.servicePushState(state, self.servicename);
};


cantrol.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI

	return defer.promise;
};

cantrol.prototype.getAlbumArt = function (data, path) {

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





cantrol.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

cantrol.prototype._searchArtists = function (results) {

};

cantrol.prototype._searchAlbums = function (results) {

};

cantrol.prototype._searchPlaylists = function (results) {


};

cantrol.prototype._searchTracks = function (results) {

};

cantrol.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

// Handle go to artist and go to album function

     return defer.promise;
};







//update the volumio Volume Settings, mainly makes this an Override plugin
cantrol.prototype.updateVolumeSettings = function() {
	var self = this;
    var defer = libQ.defer();

    //Prepare the data for updating the Volume Settings
    //first read the audio-device information, since we won't configure this 
        var volSettingsData = {
            'pluginType': 'system_controller',
            'pluginName': 'cantrol',
            'volumeOverride': true
        };
        volSettingsData.device = self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice');
        volSettingsData.name = "testi";
//self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getAlsaCards', '')[volSettingsData.device].name;
        volSettingsData.devicename = 'CXA80_JJ';
        volSettingsData.mixer = 'CXA80_J3';
        volSettingsData.maxvolume = 100;
        volSettingsData.volumecurve = '';
        volSettingsData.volumesteps = 1;
        volSettingsData.currentmute = 0;
        self.commandRouter.volumioUpdateVolumeSettings(volSettingsData)
        //.then(resp => {
        //    self.logger.info("[cantrol] updateVolumeSettings: " + JSON.stringify(volSettingsData + ' ' + resp));
            defer.resolve();
        //})
        //.fail(err => {
        //    self.logger.error("[cantrol] updateVolumeSettings: volumioUpdateVolumeSettings failed:" + err );
        //    defer.reject(err);
        //})
    return defer.promise;
};


//override the alsavolume function to send volume commands to the amp
cantrol.prototype.alsavolume = function (VolumeInteger) {
	var self = this;
    var defer = libQ.defer();
    self.volumioupdatevolume();
    self.logger.info('[cantrol] alsavolume: Set volume "' + VolumeInteger + '"');
        switch (VolumeInteger) {
            case 'mute':
            // Mute
                     self.logger.CAdebug('alsavolume: send dedicated muteOn.','debug');
                    //defer.resolve(self.waitForAcknowledge('mute'));
                    self.sendCommand('Mute_On');
                
                break;
            case 'unmute':
            // Unmute (inverse of mute)
                    self.logger.CAdebug('alsavolume: send dedicated muteOff.','debug');
                    self.sendCommand('Mute_Off');
                break;
            case 'toggle':
            // Toggle mute
                self.logger.CAdebug('alsavolume: send muteToggle.','debug');
                self.sendCommand('Mute_Toggle');
                break;
            case '+':
            	self.logger.CAdebug('alsavolume: increase volume by single step.','debug');
               self.sendCommand('Volume_Up');
                break;
            case '-':
				self.logger.CAdebug('alsavolume: decrease volume by single step.','debug');
				self.sendCommand('Volume_Down');
            break;
            default:
            //set volume to integer
                self.logger.CAdebug('alsavolume: set volume to integer value.','debug');
                if (VolumeInteger>50) {
					self.sendCommand('Volume_Up');
                } else if (VolumeInteger<50){
					self.sendCommand('Volume_Down');
                }
                break;   
        };
        defer.resolve();
    return defer.promise;
};


cantrol.prototype.getVolumeObject = function() {
	// returns the current amplifier settings in an object that volumio can use
		var volume = {};
		var self = this;
	
		volume.mute = 0;
		volume.vol=50;
		volume.disableVolumeControl = false;
		self.logger.CAdebug('getVolumeObject: ' + JSON.stringify(volume),'info');
	
		return volume;
	};
	
	cantrol.prototype.volumioupdatevolume = function() {
		var self = this;
		return self.commandRouter.volumioupdatevolume(self.getVolumeObject());
	};
	
	cantrol.prototype.retrievevolume = function () {
		var self = this;
		return self.getVolumeObject();
	}
	
// a pushState event has happened. Check whether it differs from the last known status and
// switch output port on or off respectively
cantrol.prototype.parseStatus = function(state) {	
var self = this;    
self.logger.CAdebug("State changed to: " + state.status,'info');
    if((state.status!='pause' && state.status!='stop')){
        self.sendCommand('powerOn')
    } 
};

/*
// Volumio Play
CoreCommandRouter.prototype.volumioPlay = function (N) {
    this.pushConsoleMessage('CoreCommandRouter::volumioPlay');
  
    this.stateMachine.unSetVolatile();
  
    if (N === undefined) { return this.stateMachine.play(); } else {
      return this.stateMachine.play(N);
    }
  };
  
  // Volumio Play
  CoreCommandRouter.prototype.volumioVolatilePlay = function () {
    this.pushConsoleMessage('CoreCommandRouter::volumioVolatilePlay');
  
    return this.stateMachine.volatilePlay();
  };
*/
/*
cantrol.prototype.binary = function (num, bits)
{
 let n = num & parseInt("1".repeat(bits),2);
 let binStr = n.toString(2); 
 let binStrF = ("0".repeat(bits)).substring(binStr.length) + binStr;
 return binStrF;
}

cantrol.prototype.rc5 = function (device, command)
{
 var self = this;   
 var com = '1';
 com += command > 63 ? '1' : '0';
 com += self.control ? '1' : '0';
 self.control = !self.control;
 com += binary(device,5);
 com += binary(command,6);
 return com;
}

cantrol.prototype.sendRc5 = function (command)
{
    var self = this;
    pigpio.waveClear();

    let waveform = [];
    for (let bit of command) {
        if(bit == '0')
        {
            waveform.push({ gpioOn: 0, gpioOff: self.outPin, usDelay: self.RC5_del });
            waveform.push({ gpioOn: self.outPin, gpioOff: 0, usDelay: self.RC5_del });
        } else {
            waveform.push({ gpioOn: 0, gpioOff: self.outPin, usDelay: self.RC5_del });
            waveform.push({ gpioOn: self.outPin, gpioOff: 0, usDelay: self.RC5_del });
        }    
    }    
    pigpio.waveAddGeneric(waveform);
    let waveId = pigpio.waveCreate();
    
    if (waveId >= 0) {
      pigpio.waveTxSend(waveId, pigpio.WAVE_MODE_ONE_SHOT);
    }
    while (pigpio.waveTxBusy()) {}
    pigpio.waveDelete(waveId);
    self.output.digitalWrite(0);
}*/

cantrol.prototype.saveSettings = function (data)
{
    var self = this;
    let amplifier = data['amplifier']['value'];
    self.logger.CAdebug(amplifier, 'info');
}
