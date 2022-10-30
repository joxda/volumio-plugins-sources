'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


module.exports = cantrolcd;
function cantrolcd(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
	this.debug = true;
    // Setup Debugger
    self.logger.CAdebugCD = function (data, level) {
        if(self.debug)
        {
        switch (level) {
            case "info":
                self.logger.info('[CAntrolCD Debug] ' + data);
                break;
            case "warn":
                self.logger.warn('[CAntrolCD Debug] ' + data);
                break;
            case "debug":
                self.logger.debug('[CAntrolCD Debug] ' + data);
            default:
                break;
            }
        };
        if (level == "error")
        {
            self.logger.error('[CAntrolCD Debug] ' + data);
        }
    }
}



cantrolcd.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	let rdata = fs.readFileSync(__dirname+"/config.json");
	self.configJSON = JSON.parse(rdata);

    return libQ.resolve();
}

cantrolcd.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();
	self.control = true;
	self.mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service','mpd');
	self.addResource();
	self.addToBrowseSources();

	self.serviceName = "cantrolcd";
  
	defer.resolve();
    return defer.promise;
};

cantrolcd.prototype.addResource = function() {
	var self=this;

	var nav = fs.readJsonSync(__dirname+'/navigation.json');
	var baseNavigation = nav.baseNavigation;

	self.rootNavigation = JSON.parse(JSON.stringify(baseNavigation));
	self.controls = JSON.parse(JSON.stringify(nav.controls));
	self.rootNavigation.navigation.prev.uri = '/';
}

cantrolcd.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();
    return defer.promise;
};

cantrolcd.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};

cantrolcd.prototype.sendNumCom = function (com)
{
    var self = this;
    // execute(pin, device, command, toggle, repeat)
    self.logger.CAdebugCD('/usr/bin/python /data/plugins/music_service/cantrolcdcd/pygpio.py '+self.configJSON["output_pin"]+' '+self.configJSON["devNum"]+' '+com+' '+self.control+' '+self.configJSON["repeat"]+' '+self.configJSON["half_period"],'info');
    execSync('/usr/bin/python /data/plugins/music_service/cantrolcdcd/pygpio.py '+self.configJSON["output_pin"]+' '+self.configJSON["devNum"]+' '+com+' '+self.control+' '+self.configJSON["repeat"]+' '+self.configJSON["half_period"], { uid: 1000, gid: 1000, encoding: 'utf8' });
    // when settings are loaded use something like parseInt
}
	//send commands to the cd player
    cantrolcd.prototype.sendCommand  = function(...cmd) {
        var self = this;
        var defer = libQ.defer();
    
        var cmdString = '';
        self.logger.CAdebugCD("sendCommand: send " + cmd,'info');


        if (self.configJSON)
        {
            let cmdo = self.configJSON[cmd];
            // CHECK THAT IT IS VALID
            
            defer.resolve();
        }
        else {
            defer.fail("no cd settings active");
        }
        
        return defer.promise;
    }
// Configuration Methods -----------------------------------------------------------------------------

cantrolcd.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
			var files = fs.readdirSync(__dirname+"/cdConfs").filter(fn => fn.endsWith(".json"));

            self.cdName = self.configJSON['name'];
	    self.logger.CAdebugCD(self.cdName,"error");
            var opts = [];

            var value = {};
            for (let i=1; i <= files.length; i++)
            {
                self.logger.CAdebugCD(files[i-1],"error");
                let rawdata = fs.readFileSync(__dirname+"/cdConfs/"+files[i-1]);
                let cdJson = JSON.parse(rawdata);
                self.logger.CAdebugCD(JSON.stringify(cdJson),"error");
		self.logger.CAdebugCD(self.cdName,"error");
                opts.push( { "value": i, "label": cdJson["name"]} );
                if(self.cdName == cdJson["name"])
                {
                    value = {"value": i, "label": cdJson["name"]};
                    self.configJSON = cdJson;
                }
            }
            opts.push( { "value": files.length+1, "label": "TRANSLATE.CONFIG"+"..."} );

            uiconf["sections"][0].content[0]["value"] = value;
            uiconf["sections"][0].content[0]["options"] = opts;

            //for (let i=0; i < self.ampJSON["Commands"].length; i++)
            let first = true;
            for (const [key, value] of Object.entries(self.configJSON["Commands"])) 
            {
                let btn = 	{	  "id":key,
                    "element": "button",
                    "label": key,
                    "doc": "TRANSLATE.TEST_BUTTON",
                    "onClick": {"type":"emit", "message":"callMethod", "data":{"endpoint":"music_service/cantrolcd","method":"sendNumCom","data":value}}
                };
                if (first){
                    btn["description"] = "TRANSLATE.TEST_BUTTON";
                    first = false;
                } else {
                    btn["doc"] = "TRANSLATE.TEST_BUTTON";
                }
                uiconf["sections"][0].content.push(btn);
            }
            
            for (let i=0; i < self.configJSON["Miscellaneous"].length; i++)
            {
                let key = self.configJSON["Miscellaneous"][i]["name"];
                let value = self.configJSON["Miscellaneous"][i]["code"];
                let btn = 	{	  "id":key,
                    "element": "button",
                    "label": key,
                    "onClick": {"type":"emit", "message":"callMethod", "data":{"endpoint":"music_service/cantrolcd","method":"sendNumCom","data":value}}
                };
                if (i==0){
                    btn["description"] = "TRANSLATE.TEST_BUTTON";
                } else {
                    btn["doc"] = "TRANSLATE.TEST_BUTTON";
                }
                uiconf["sections"][0].content.push(btn);
            }
            first = true;
            for (const [key, value] of Object.entries(self.configJSON["Commands"]))
                {
                    let txt = 	{	  "id":key+"TXT",
                        "element": "input",
                        "label": key,
                        "value": value,
                        "visibleIf": {"field": "cdplayer", "value": files.length+1},
                        "attributes": [
                            {"type": "number"}, {"min": 0}, {"max":127}
                          ]
                };
                if (first){
                    txt["description"] = "TRANSLATE.TEST_BUTTON";
                    first = false;
                } else {
                    txt["doc"] = "TRANSLATE.TEST_BUTTON";
                }
                    uiconf["sections"][0].content.push(txt);
                }
                
                for (let i=0; i < self.configJSON["Miscellaneous"].length; i++)
                {
                    let key = self.configJSON["Miscellaneous"][i]["name"];
                    let value = self.configJSON["Miscellaneous"][i]["code"];
                    let txt = 	{	  "id":key+"TXT",
                        "element": "input",
                        "label": key,
                        "value": value,
                        "visibleIf": {"field": "cdplayer", "value": files.length+1 }                    };
                        if (i==0){
                            txt["description"] = "TRANSLATE.TEST_BUTTON";
                        } else {
                            txt["doc"] = "TRANSLATE.TEST_BUTTON";
                        }
                    uiconf["sections"][0].content.push(txt);
                }
            defer.resolve(uiconf);
	   } )
        .fail((e) => 
        {
            self.logger.error('Could not fetch CAntrol UI Configuration: ' + e);
            defer.reject(new Error());
        });

    return defer.promise;
};

cantrolcd.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

cantrolcd.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

cantrolcd.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

cantrolcd.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


cantrolcd.prototype.addToBrowseSources = function () {
	var self = this;
	let data = {
	  name: 'CD Player',
	  uri: 'cdplayer',
	  plugin_type: 'music_service',
	  plugin_name: "cantrolcd",
	  icon: 'fa-light fa-compact-disc'
    };
	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

cantrolcd.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    //self.commandRouter.logger.info(curUri);
    var response;

	if (curUri.startsWith('cdplayer')) {
		if (curUri === 'cdplayer/play') {
            self.mpdPlugin.sendMpdCommand('stop', [])
            .then(function() {
                return self.mpdPlugin.sendMpdCommand('clear', []);
            }) // TBD use cantrol to select CD?!
            .then(function() {
                self.sendCommand("play"); // TBD TEST WHETHER IT COULD MAKE MORE SENSE TO USE FOLDER AMD THEN REROUTE STUFF?
            })	}
        else if (curUri === 'cdplayer/stop') {
            self.sendCommand("stop");		}
		else if (curUri === 'cdplayer/pause') {
            self.sendCommand("pause");		}
		else if (curUri === 'cdplayer/forwards') {
            self.sendCommand("forwards");		}
		else if (curUri === 'cdplayer/backwards') {
            self.sendCommand("backwards");		}
		response = self.getRootContent();
		
	  }
	
	  return response
		.fail(function (e) {
		  self.logger.CAdebugCD('handleBrowseUri failed='+e,"error");
		  libQ.reject(new Error());
		});
	};

    /*var self = this;
	var defer = libQ.defer();
	return self.mpdPlugin.sendMpdCommand('stop', [])
    .then(function() {
        return self.mpdPlugin.sendMpdCommand('clear', []);
    }) // TBD use cantrol to select CD?!
    .then(function() {
		self.sendCommand("play"); // TBD TEST WHETHER IT COULD MAKE MORE SENSE TO USE FOLDER AMD THEN REROUTE STUFF?
        return libQ.resolve();
    })*/
	cantrolcd.prototype.getRootContent = function() {
		var self=this;
		var response;
	  
		response = self.rootNavigation;
		response.navigation.lists[0].items = [];
		for (var key in self.controls) {
			var cntrl = {
			  service: self.serviceName,
			  type: 'folder',
			  title: self.controls[key].title,
			  uri: self.controls[key].uri,
			  //artist: '',
			  //album: '',
			  icon: 'fa-solid fa-play'
              //albumart: '/albumart?sourceicon=music_service/personal_radio/logos/'+key+'.png'
			};
			response.navigation.lists[0].items.push(cntrl);
		}
	  
		return libQ.resolve(response);
	  };

// Define a method to clear, add, and play an array of tracks
cantrolcd.prototype.clearAddPlayTrack = function(track) {
	return libQ.resolve();
};

cantrolcd.prototype.seek = function (timepos) {
	return libQ.resolve();
};

// Stop
cantrolcd.prototype.stop = function() {
    return libQ.resolve();
	//var self = this;
	//self.sendCommand("stop");
};

// Spop pause
cantrolcd.prototype.pause = function() {
	//var self = this;
	//self.sendCommand("pause");
    return libQ.resolve();
};

// Get state
cantrolcd.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrolcd::getState');
};

//Parse state
cantrolcd.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrolcd::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
cantrolcd.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'cantrolcd::pushState');

	return self.commandRouter.servicePushState(state, self.servicename);
};


cantrolcd.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI
	return defer.promise;
};

cantrolcd.prototype.getAlbumArt = function (data, path) {

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





cantrolcd.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

cantrolcd.prototype._searchArtists = function (results) {

};

cantrolcd.prototype._searchAlbums = function (results) {

};

cantrolcd.prototype._searchPlaylists = function (results) {


};

cantrolcd.prototype._searchTracks = function (results) {

};

cantrolcd.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

// Handle go to artist and go to album function

     return defer.promise;
};


cantrolcd.prototype.saveSettings = function (data)
{
    var self = this;
    let cdplayer = data['cdplayer']['value'];
    self.logger.CAdebugCD(cdplayer, 'info');
}
