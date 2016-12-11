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
            if(this.brightness > 0) {
                this.power = true;
            } else {
                this.power = false;
            }
        }
    }

    //also make sure this change is directly communicated to HomeKit
    this.setFromLoxone = true;
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .setValue(this.power);
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .setValue(this.brightness);
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.Hue)
        .setValue(this.hue);
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.Saturation)
        .setValue(this.saturation);

    //because the 3 values are communicated separately for Homekit, work with a small time window
    var self = this;
    setTimeout(function(){  self.setFromLoxone = false; }, 1000);

}

ColorItem.prototype.getOtherServices = function() {

    this.setInitialState = true;

    var otherService = new this.homebridge.hap.Service.Lightbulb();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemPowerState.bind(this))
        .on('get', this.getItemPowerState.bind(this))
        .setValue(this.power);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .on('set', this.setItemBrightnessState.bind(this))
        .on('get', this.getItemBrightnessState.bind(this))
        .setValue(this.brightness);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Hue)
        .on('set', this.setItemHueState.bind(this))
        .on('get', this.getItemHueState.bind(this))
        .setValue(this.hue);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Saturation)
        .on('set', this.setItemSaturationState.bind(this))
        .on('get', this.getItemSaturationState.bind(this))
        .setValue(this.saturation);

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
    //added some logic to prevent a loop when the change because of external event captured by callback

    var self = this;

    if (this.setInitialState) {
        //because the other 3 values are communicated separately for Homekit, work with a small time window
        setTimeout(function(){   self.setInitialState = false; }, 1000);
        callback();
        return;
    }

    if (this.setFromLoxone) {
        callback();
        return;
    }

    var command = (value) ? 'On' : 'Off';
    this.log("[color] iOS - send message to " + this.name + ": " + command);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();

};

ColorItem.prototype.setItemHueState = function(value, callback) {
    this.hue = parseInt(value);
    this.setColorState(callback);
}
ColorItem.prototype.setItemSaturationState = function(value, callback) {
    this.saturation = parseInt(value);
    this.setColorState(callback);
}
ColorItem.prototype.setItemBrightnessState = function(value, callback) {
    this.brightness = parseInt(value);
    if(this.brightness > 0) {
        this.power = true;
    } else {
        this.power = false;
    }
    this.setColorState(callback);
}

ColorItem.prototype.setColorState = function(callback) {
    if (this.setInitialState || this.setFromLoxone) {
        callback();
        return;
    }

    //compose hsv string
    var command = "hsv(" + this.hue + "," + this.saturation + "," + this.brightness + ")";
    this.log("[color] iOS - send message to " + this.name + ": " + command);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();
}
module.exports = ColorItem;