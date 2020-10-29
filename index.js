let Accessory, Service, Characteristic, UUIDGen;
const request = require("request");
const ItemFactory = require('./libs/ItemFactory.js');
const Utility = require('./libs/Utility.js');
const WSListener = require('./libs/WSListener.js');

module.exports = homebridge => {
    console.log(`homebridge API version: ${homebridge.version}`);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Keep refference to the passes API object
    Homebridge = homebridge;

    //Add inheritance of the AbstractItem to the Accessory object
    Utility.addSupportTo(ItemFactory.AbstractItem, Accessory);
        //All other items are child of the abstractItem
        Utility.addSupportTo(ItemFactory.TemperatureSensor, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Outlet, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Dimmer, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Switch, ItemFactory.AbstractItem);
        Utility.addSupportTo(ItemFactory.Jalousie, ItemFactory.AbstractItem);
    homebridge.registerPlatform("homebridge-loxoneWs", "LoxoneWs", LoxPlatform);
};

// Platform constructor
// config may be null
function LoxPlatform(log, config) {
    //log("LoxPlatform Init");
    const platform = this;
    this.log = log;
    this.config = config;
    this.protocol = "http";

    if (!this.config['host']) throw new Error("Configuration missing: loxone host (please provide the IP address here)");
    if (!this.config['port']) throw new Error("Configuration missing: loxone port (if default port, specify 7777)");
    if (!this.config['username']) throw new Error("Configuration missing: loxone username");
    if (!this.config['password']) throw new Error("Configuration missing: loxone password");

    this.host           = config["host"];
    this.port           = config["port"];
    this.username       = config["username"];
    this.password       = config["password"];

    //Also make a WS connection
    this.ws = new WSListener(platform);
}

LoxPlatform.prototype.accessories = function(callback) {
    const that = this;
    //this.log("Getting Loxone configuration.");
    const itemFactory = new ItemFactory.Factory(this,Homebridge);
    const url = itemFactory.sitemapUrl();
    this.log("Platform - Waiting 8 seconds until initial state is retrieved via WebSocket.");
    setTimeout(() => {
        that.log(`Platform - Retrieving initial config from ${url}`);
        request.get({
            url,
            json: true
        }, (err, response, json) => {
            if (!err && response.statusCode === 200) {
                callback(itemFactory.parseSitemap(json));
            } else {
                that.log("Platform - There was a problem connecting to Loxone.");
            }
        })
    },8000);
};