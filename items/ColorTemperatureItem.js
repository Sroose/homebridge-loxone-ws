"use strict";

var request = require("request");

var ColorTemperatureItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a colorpicker, use the uuidAction
    this.stateUuid = widget.states.color; //a colorpicker always has a state called color, which is the uuid which will receive the event to read

    this.uuidActionOriginal = widget.uuidActionOriginal;

    this.colortemperature = 0;
    this.brightness = 0;
    this.power = false;

    ColorTemperatureItem.super_.call(this, widget,platform,homebridge);
};

// transform Loxone color temperature (expressed in Kelvins 2700-6500k to Homekit values 140-500)
function loxoneToHomekitColorTemperature(ct, obj) {

    var minCtLoxone = 2700;
    var maxCtLoxone = 6500;

    var minCtHomekit = 140;
    var maxCtHomekit = 500;

    var percent = 1 - ((ct - minCtLoxone) / (maxCtLoxone - minCtLoxone));
    var newValue = Math.round(minCtHomekit + ((maxCtHomekit - minCtHomekit) * percent));

    //obj.log('loxoneToHomekitColorTemperature - Loxone Value: ' + ct);
    //obj.log('loxoneToHomekitColorTemperature - Percent: ' + percent + '%');
    //obj.log('loxoneToHomekitColorTemperature - Homekit Value: ' + newValue);

    return newValue;
}

// transform Homekit color temperature (expressed 140-500 to Loxone values expressed in Kelvins 2700-6500k)
function homekitToLoxoneColorTemperature(ct, obj) {

    var minCtLoxone = 2700;
    var maxCtLoxone = 6500;

    var minCtHomekit = 140;
    var maxCtHomekit = 500;

    var percent = 1 - ((ct - minCtHomekit) / (maxCtHomekit - minCtHomekit));
    var newValue = Math.round(minCtLoxone + ((maxCtLoxone - minCtLoxone) * percent));

    //obj.log('homekitToLoxoneColorTemperature - Homekit Value: ' + ct);
    //obj.log('homekitToLoxoneColorTemperature - Percent: ' + percent + '%');
    //obj.log('homekitToLoxoneColorTemperature - Loxone Value: ' + newValue);

    return newValue;
}

// Register a listener to be notified of changes in this items value
ColorTemperatureItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

ColorTemperatureItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for ColorTemp: " + value);

    //incoming value is a temp() string that needs to be parsed
    var m;

    if (m = value.match(/^\W*hsv?\(([^)]*)\)\W*$/i)) {
        // this light is being controlled by hsv() (color) values now, set this temp device to Off
        if ((this.power == true) || (this.brightbness > 0)) {
            this.power = false;
            this.brightness = 0;
            //console.log("Got hsv() state for ColorTemp: turning off");
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.On)
                .updateValue(this.power);
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
                .updateValue(this.brightness);
        }

    } else if (m = value.match(/^\W*temp?\(([^)]*)\)\W*$/i)) {
        var params = m[1].split(',');

        // could also be a colour temp update in the form: temp(100,4542)
        this.brightness = parseInt(params[0]);
        this.colortemperature = loxoneToHomekitColorTemperature(parseInt(params[1]), this);
        this.power = this.brightness > 0;

        //also make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.power);
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
            .updateValue(this.brightness);
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.ColorTemperature)
            .updateValue(this.colortemperature);

    }

};

ColorTemperatureItem.prototype.getOtherServices = function() {

    var otherService = new this.homebridge.hap.Service.Lightbulb();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemPowerState.bind(this))
        .on('get', this.getItemPowerState.bind(this))
        .updateValue(this.power);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .on('set', this.setItemBrightnessState.bind(this))
        .on('get', this.getItemBrightnessState.bind(this))
        .updateValue(this.brightness);

    otherService.addOptionalCharacteristic(this.homebridge.hap.Characteristic.ColorTemperature);
    otherService.getCharacteristic(this.homebridge.hap.Characteristic.ColorTemperature)
        .on('set', this.setItemColorTemperatureState.bind(this))
        .on('get', this.getItemColorTemperatureState.bind(this))
        .setProps({
            minValue: 140,
            maxValue: 500
          })
        .updateValue(this.colortemperature);

    return otherService;
};

ColorTemperatureItem.prototype.getItemPowerState = function(callback) {
    callback(undefined, this.power);
};
ColorTemperatureItem.prototype.getItemBrightnessState = function(callback) {
    callback(undefined, this.brightness);
};
ColorTemperatureItem.prototype.getItemColorTemperatureState = function(callback) {
    callback(undefined, this.colortemperature);
};

ColorTemperatureItem.prototype.setItemPowerState = function(value, callback) {

    //var command = (value == true) ? 'On' : 'Off';
    //this.platform.ws.sendCommand(this.uuidAction, command);

    //sending new power state to loxone
    if (!value) {
        //loxone does not understand 'on' or 'off', we interpret Homekit 'off' as setting brightness to 0
        this.brightness = 0;
        //this.log('ColorTemp ** setItemPowerState: ' + value);
        this.setColorState(callback);
    } else {
        //this.log('ColorTemp ** setItemPowerState (empty): ' + value);
        this.power = true;
        this.brightness = 100;
        callback();
    }

};

ColorTemperatureItem.prototype.setItemBrightnessState = function(value, callback) {
    this.brightness = parseInt(value);
    this.power = this.brightness > 0;
    //this.log('ColorTemp ** setItemBrightnessState: ' + value);
    this.setColorState(callback);
};

ColorTemperatureItem.prototype.setItemColorTemperatureState = function(value, callback) {
    this.colortemperature = parseInt(value);
    //this.log('ColorTemp ** setItemColorTemperatureState: ' + value);
    this.setColorState(callback);
};

ColorTemperatureItem.prototype.setColorState = function(callback) {
    //compose temp() string
    var command = "temp(" + this.brightness + "," + homekitToLoxoneColorTemperature(this.colortemperature, this) + ")";
    this.log("[colortemperature] iOS - send message to " + this.name + ' ' + this.uuidActionOriginal + ' ' + command);
    this.platform.ws.sendCommand(this.uuidActionOriginal, command);
    callback();
};

module.exports = ColorTemperatureItem;