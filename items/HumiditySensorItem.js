"use strict";

var request = require("request");

var HumiditySensorItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.currentHumidity = undefined;

    HumiditySensorItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
HumiditySensorItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
};

HumiditySensorItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener
    this.currentHumidity = value;

    //also make sure this change is directly communicated to HomeKit
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.CurrentRelativeHumidity)
        .setValue(this.currentHumidity);
};

HumiditySensorItem.prototype.getOtherServices = function() {
    var otherService = new this.homebridge.hap.Service.HumiditySensor();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentRelativeHumidity)
        .on('get', this.getItemState.bind(this))
        .setValue(this.currentHumidity);

    return otherService;
};

HumiditySensorItem.prototype.getItemState = function(callback) {
   callback(undefined, this.currentHumidity);
};

module.exports = HumiditySensorItem;