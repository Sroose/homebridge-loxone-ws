"use strict";

var request = require("request");

var LightSensorItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.lightlevel = 0;

    LightSensorItem.super_.call(this, widget, platform, homebridge);
};

// Register a listener to be notified of changes in this items value
LightSensorItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
};

LightSensorItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener

    //console.log("Got new state for Light Level: " + value);

    this.lightlevel = value;

    //also make sure this change is directly communicated to HomeKit
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.CurrentAmbientLightLevel)
        .setValue(this.lightlevel);
};

LightSensorItem.prototype.getOtherServices = function() {
    var otherService = new this.homebridge.hap.Service.LightSensor();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentAmbientLightLevel)
        .on('get', this.getItemState.bind(this))
        .setValue(this.lightlevel);

    return otherService;
};

LightSensorItem.prototype.getItemState = function(callback) {
   callback(undefined, this.lightlevel);
};

module.exports = LightSensorItem;