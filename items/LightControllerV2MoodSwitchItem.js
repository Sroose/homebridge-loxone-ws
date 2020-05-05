"use strict";

var request = require("request");

var LightControllerV2MoodSwitchItem = function(widget,platform,homebridge) {
    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.stateUuidActiveMoods = widget.states.activeMoods;
    this.mood = widget.mood;
    this.uuidActionOriginal = widget.uuidActionOriginal;

    this.currentState = undefined; 

    LightControllerV2MoodSwitchItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
LightControllerV2MoodSwitchItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.stateUuidActiveMoods, this.callBackActiveMoods.bind(this));
};

LightControllerV2MoodSwitchItem.prototype.callBackActiveMoods = function(value) {
    this.currentState = (value.indexOf(this.mood.id) > -1);
    //console.log('Mood ' + this.mood.name + ': IsOn? ' + this.currentState);

    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .updateValue(this.currentState);
};

LightControllerV2MoodSwitchItem.prototype.getOtherServices = function() {
    var otherService = new this.homebridge.hap.Service.Switch();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))

    return otherService;
};

LightControllerV2MoodSwitchItem.prototype.getItemState = function(callback) {
    callback(undefined, this.currentState);
};

LightControllerV2MoodSwitchItem.prototype.setItemState = function(value, callback) {
    if (value == true) {
        // update local state
        this.currentState = true;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.currentState);

        // send the mood change command to Loxone
        var command = 'changeTo/' + this.mood.id;
        //this.log("[LightControllerV2MoodSwitch] Send message to " + this.name + "uuidAction: '" + this.uuidActionOriginal + "' Command: '" + command + "'");
        this.platform.ws.sendCommand(this.uuidActionOriginal, command);

    } else if (this.currentState == true) {
        //this.log("[LightControllerV2MoodSwitch] Asking to be turned off, but it's currently on, need to cancel. " + this.name + "uuidAction: '" + this.uuidActionOriginal);

        // if we are trying to turn this Off, and we're currently On, then we cancel the action
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .setValue(this.currentState);

    }

    callback();

};

module.exports = LightControllerV2MoodSwitchItem;