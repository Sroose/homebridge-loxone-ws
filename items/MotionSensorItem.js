"use strict";

var request = require("request");

var MotionSensorItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.motiondetected = false;

    MotionSensorItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
MotionSensorItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
};

MotionSensorItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener

    //console.log("Got new state for Motion: " + value);

    this.motiondetected = value;

    //also make sure this change is directly communicated to HomeKit
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.MotionDetected)
        .setValue(this.motiondetected);
};

MotionSensorItem.prototype.getOtherServices = function() {
    var otherService = new this.homebridge.hap.Service.MotionSensor();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.MotionDetected)
        .on('get', this.getItemState.bind(this))
        .setValue(this.motiondetected);

    return otherService;
};

MotionSensorItem.prototype.getItemState = function(callback) {
   callback(undefined, this.motiondetected);
};

module.exports = MotionSensorItem;