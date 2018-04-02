"use strict";

var request = require("request");

var ColorItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a colorpicker, use the uuidAction
    this.stateUuid = widget.states.color; //a colorpicker always has a state called color, which is the uuid which will receive the event to read

    this.hue = 0;
    this.saturation = 0;
    this.brightness = 0;
    this.power = false;

    ColorItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
ColorItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

ColorItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for color " + value);

    //incoming value is a HSV string that needs to be parsed
    var m;
    if (m = value.match(/^\W*hsv?\(([^)]*)\)\W*$/i)) {
        var params = m[1].split(',');
        var re = /^\s*(\d*)(\.\d+)?\s*$/;
        var mH, mS, mV;
        if (
            params.length >= 3 &&
            (mH = params[0].match(re)) &&
            (mS = params[1].match(re)) &&
            (mV = params[2].match(re))
        ) {
            var h = parseFloat((mH[1] || '0') + (mH[2] || ''));
            var s = parseFloat((mS[1] || '0') + (mS[2] || ''));
            var v = parseFloat((mV[1] || '0') + (mV[2] || ''));

            this.hue = parseInt(h);
            this.saturation = parseInt(s);
            this.brightness = parseInt(v);
            this.power = this.brightness > 0;
        }
    } else if (m = value.match(/^\W*temp?\(([^)]*)\)\W*$/i)) {
        var params = m[1].split(',');

        // could also be a colour temp update in the form: temp(100,4542)
        this.brightness = parseInt(params[0]);
        this.power = this.brightness > 0;

    }

    //also make sure this change is directly communicated to HomeKit
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .updateValue(this.power);
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .updateValue(this.brightness);
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.Hue)
        .updateValue(this.hue);
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.Saturation)
        .updateValue(this.saturation);

};

ColorItem.prototype.getOtherServices = function() {

    var otherService = new this.homebridge.hap.Service.Lightbulb();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemPowerState.bind(this))
        .on('get', this.getItemPowerState.bind(this))
        .updateValue(this.power);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .on('set', this.setItemBrightnessState.bind(this))
        .on('get', this.getItemBrightnessState.bind(this))
        .updateValue(this.brightness);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Hue)
        .on('set', this.setItemHueState.bind(this))
        .on('get', this.getItemHueState.bind(this))
        .updateValue(this.hue);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Saturation)
        .on('set', this.setItemSaturationState.bind(this))
        .on('get', this.getItemSaturationState.bind(this))
        .updateValue(this.saturation);

    return otherService;
};

ColorItem.prototype.getItemPowerState = function(callback) {
    callback(undefined, this.power);
};
ColorItem.prototype.getItemBrightnessState = function(callback) {
    callback(undefined, this.brightness);
};
ColorItem.prototype.getItemHueState = function(callback) {
    callback(undefined, this.hue);
};
ColorItem.prototype.getItemSaturationState = function(callback) {
    callback(undefined, this.saturation);
};

ColorItem.prototype.setItemPowerState = function(value, callback) {

    //sending new power state to loxone
    if (!value) {
        //loxone does not understand 'on' or 'off', we interpret Homekit 'off' as setting brightness to 0
        this.brightness = 0;
        this.setColorState(callback);
    } else {
        callback();
    }

};

ColorItem.prototype.setItemHueState = function(value, callback) {
    this.hue = parseInt(value);
    this.setColorState(callback);
};

ColorItem.prototype.setItemSaturationState = function(value, callback) {
    this.saturation = parseInt(value);
    this.setColorState(callback);
};

ColorItem.prototype.setItemBrightnessState = function(value, callback) {
    this.brightness = parseInt(value);
    this.power = this.brightness > 0;
    this.setColorState(callback);
};

ColorItem.prototype.setColorState = function(callback) {
    //compose hsv string
    var command = "hsv(" + this.hue + "," + this.saturation + "," + this.brightness + ")";
    this.log("[color] iOS - send message to " + this.name + ": " + command);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();
};

module.exports = ColorItem;