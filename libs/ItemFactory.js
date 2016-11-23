"use strict";
var exports = module.exports = {};
exports.AbstractItem = require('../items/AbstractItem.js');
//Important: name the exports identical to Loxone type to have an automatic match
//If not possible, define in checkCustomAttrs which will override in certain cases
exports.TemperatureSensor = require('../items/TemperatureSensorItem.js');
exports.Switch = require('../items/SwitchItem.js');
exports.Lightbulb = require('../items/LightbulbItem.js');
exports.Dimmer = require('../items/DimmerItem.js');
exports.Jalousie = require('../items/BlindsItem.js');
exports.Pushbutton = require('../items/PushbuttonItem.js');
exports.Colorpicker = require('../items/ColorpickerItem.js');


exports.Factory = function(LoxPlatform,homebridge) {
    this.platform = LoxPlatform;
    this.log = this.platform.log;
    this.homebridge = homebridge;
    this.itemList = [];
    this.catList = [];
    //this.uniqueIds = [];
};

//TODO: we could also get this information from the websocket, avoiding the need of an extra request.

exports.Factory.prototype.sitemapUrl = function () {
    var serverString = this.platform.host;
    var serverPort = this.platform.port;
    if (this.platform.username && this.platform.password) {
        serverString = encodeURIComponent(this.platform.username) + ":" + encodeURIComponent(this.platform.password) + "@" + serverString + ":" + serverPort;
    }

    return this.platform.protocol + "://" + serverString + "/data/LoxApp3.json";
};

exports.Factory.prototype.parseSitemap = function (jsonSitemap) {

    //this is the function that gets called by index.js
    //first, parse the Loxone JSON that holds all controls
    exports.Factory.prototype.traverseSitemap(jsonSitemap,this);
    //now convert these controls in accesories
    var totalAccessories = 1;
    var accessoryList = [];
    for (var key in this.itemList) {
        //process additional attributes
        this.itemList[key] = exports.Factory.prototype.checkCustomAttrs(this.itemList[key],this.platform, this.catList);

        if (!(this.itemList[key].type in exports)){
            this.log("Platform - The widget '" + this.itemList[key].name + "' of type "+this.itemList[key].type+" is an item not handled.");
            continue;
        }
        if (this.itemList[key].skip) {
            this.log("Platform - The widget '" + this.itemList[key].name + "' of type "+this.itemList[key].type+" was skipped.");
            continue;
        }

        var accessory = new exports[this.itemList[key].type](this.itemList[key], this.platform, this.homebridge);
        this.log("Platform - Accessory Found: " + this.itemList[key].name);
        totalAccessories += 1;

        if(totalAccessories > 100) {
            // https://github.com/nfarina/homebridge/issues/509
            throw new Error("You have more than 100 accessories for this bridge, which is not allowed by HomeKit. Try to filer out unneeded accessories.");
        }

        accessoryList.push(accessory);

    }
    return accessoryList;
};


exports.Factory.prototype.checkCustomAttrs = function(item,platform,catList) {
    //this function will make accesories more precise based on other attributes
    //eg, all InfoOnlyAnalog items which start with the name 'Temperat' are considered temperature sensors
    if(item.name.startsWith('Temperat')) {
        item.type = "TemperatureSensor";

    } else if(catList[item.cat] !== undefined && catList[item.cat].image == "00000000-0000-0002-2000000000000000.svg") {
        //this is the lightbulb image, which means that this is a lightning control
        if(item.type=="Switch") {
            item.type = "Lightbulb";
        }
    } else if(item.parentType == "LightController") {
        //this is a subcontrol of a lightcontroller
        if(item.type=="Switch") {
            item.type = "Lightbulb";
        }
    }

    if(item.name.indexOf("Loxone") !== -1) {
        //this is a Loxone status or temperature, I don't need these in Siri
        item.skip = true;
    }

    item.manufacturer = "Loxone";

    return item;

};


exports.Factory.prototype.traverseSitemap = function(jsonSitmap,factory) {

    //this function will simply add every control and subcontrol to the itemList, holding all its information
    //it will also store category information, as we will use this to decide on correct Item Type
    for (var section in jsonSitmap) {
        if(section=="cats") {
             for (var item in jsonSitmap[section]) {
                item = jsonSitmap[section][item];
                //item is UUID: { ..iteminfo...} where iteminfo has uuid, name, image and other info
                if (typeof(item.uuid !== 'undefined')){
                    factory.catList[item.uuid] = item;
                }
            }
        }
        if(section=="controls") {
            for (var item in jsonSitmap[section]) {
                item = jsonSitmap[section][item];
                //item is UUID: { ..iteminfo...} where iteminfo has name, room, cat, type, uuidAction and other info
                if (typeof(item.name) !== 'undefined'){
                    factory.itemList[item.name] = item;
                    //console.log(item.name);
                }
                //if this item has subcontrols (eg for LightController), do one more level
                 if (typeof(item.subControls !== 'undefined')){
                    for (var subitem in item.subControls) {
                        subitem = item.subControls[subitem];
                        factory.itemList[subitem.name] = subitem;
                        //also keep track of the parent type, we can use this later to decide on this childs type
                        factory.itemList[subitem.name].parentType = item.type;
                        //console.log('  ' + subitem.name);
                    }
                }
            }
        }
    }

};