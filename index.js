'use strict';

var Homebridge, Accessory;
var request = require("request");
var ItemFactory = require('./libs/ItemFactory.js');
var Utility = require('./libs/Utility.js');
var WSListener = require('./libs/WSListener.js');

module.exports = function(homebridge) {
    //console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Keep refference to the passes API object
    Homebridge = homebridge;

    //Add inheritance of the AbstractItem to the Accessory object
    Utility.addSupportTo(ItemFactory.AbstractItem, Accessory);
        //All other items are child of the abstractItem
        Utility.addSupportTo(ItemFactory.LightControllerV2MoodSwitch, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.TemperatureSensor, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.HumiditySensor, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.MotionSensor, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.ContactSensor, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.LightSensor, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Dimmer, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Colorpicker, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Gate, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.DoorBell, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Jalousie, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Switch, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.TimedSwitch, ItemFactory.AbstractItem);
            //Add childs of switch
            Utility.addSupportTo(ItemFactory.Lightbulb, ItemFactory.Switch);
            Utility.addSupportTo(ItemFactory.Pushbutton, ItemFactory.Switch);

    homebridge.registerPlatform("homebridge-loxoneWs", "LoxoneWs", LoxPlatform);
};

// Platform constructor
// config may be null
function LoxPlatform(log, config) {
    //log("LoxPlatform Init");
    var platform = this;
    this.log = log;
    this.config = config;
    this.protocol = "http";

    if (!this.config['host']) throw new Error("Configuration missing: loxone host (please provide the IP address here)");
    if (!this.config['port']) throw new Error("Configuration missing: loxone port (if default port, specify 7777)");
    if (!this.config['username']) throw new Error("Configuration missing: loxone username");
    if (!this.config['password']) throw new Error("Configuration missing: loxone password");
    if (!this.config['rooms']) throw new Error("Configuration missing: rooms array");

    this.host           = config["host"];
    this.port           = config["port"];
    this.username       = config["username"];
    this.password       = config["password"];
    this.rooms          = config["rooms"];
    if (this.config['moodSwitches']) {
        this.moodSwitches = config["moodSwitches"];
    } else {
        this.moodSwitches = 'none';
    } 

    //Also make a WS connection
    this.ws = new WSListener(platform);
}

LoxPlatform.prototype.accessories = function(callback) {
    var that = this;
    //this.log("Getting Loxone configuration.");
    var itemFactory = new ItemFactory.Factory(this,Homebridge);
    var url = itemFactory.sitemapUrl();
    this.log("Platform - Waiting 10 seconds until initial state is retrieved via WebSocket.");
    setTimeout(function(){
        that.log("Platform - Retrieving initial config from " + url);
        request.get({
            url: url,
            json: true
        }, function(err, response, json) {
            if (!err && response.statusCode === 200) {
                callback(itemFactory.parseSitemap(json));
            } else {
                that.log("Platform - There was a problem connecting to Loxone.");
            }
        })
    },8000);
};




