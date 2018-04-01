"use strict";

var request = require("request");

var DimmerItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a dimmer, use the uuidAction
    this.stateUuid = widget.states.position; //a dimmer always has a state called position, which is the uuid which will receive the event to read
    this.currentState = undefined; //will be a value between 0 and 100 for dimmers

    DimmerItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
DimmerItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

DimmerItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for dimmer " + value);
    this.currentState = value;

    //also make sure this change is directly communicated to HomeKit
    this.setFromLoxone = true;
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .setValue(this.currentState > 0);
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .setValue(this.currentState,
            function() {
                this.setFromLoxone = false;
            }.bind(this)
        );
};

DimmerItem.prototype.getOtherServices = function() {

    //setting variable to skip update for intial value
    this.setInitialState = true;

    var otherService = new this.homebridge.hap.Service.Lightbulb();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemPowerState.bind(this))
        .on('get', this.getItemPowerState.bind(this))
        .setValue(this.currentState > 0);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))
        .setValue(this.currentState);

    return otherService;
};

DimmerItem.prototype.getItemState = function(callback) {
    //returns brightness value
    callback(undefined, this.currentState);
};

DimmerItem.prototype.getItemPowerState = function(callback) {
    //returns true if currentState is > 0
    callback(undefined, this.currentState > 0);
};

DimmerItem.prototype.setItemState = function(value, callback) {

    //sending new state (brighness) to loxone
    //added some logic to prevent a loop when the change because of external event captured by callback

    var self = this;

    if (this.setInitialState) {
        this.setInitialState = false;
        callback();
        return;
    }

    if (this.setFromLoxone) {
        callback();
        return;
    }

    if(value === undefined) {
        //happens at initial load
        callback();
        return;
    }

    this.log("[dimmer] iOS - send brightness message to " + this.name + ": " + value);
    var command = value; //Loxone expects a value between 0 and 100
    if (typeof this.platform.ws != 'undefined') {
      this.platform.ws.sendCommand(this.uuidAction, command);
    }
    callback();

};

DimmerItem.prototype.setItemPowerState = function(value, callback) {

    //sending new state (on/off) to loxone
    //added some logic to prevent a loop when the change because of external event captured by callback

    var self = this;

    if (this.setInitialState) {
        this.setInitialState = false;
        callback();
        return;
    }

    if (this.setFromLoxone) {
        callback();
        return;
    }

    if(value === undefined) {
        //happens at initial load
        callback();
        return;
    }

    this.log("[dimmer] iOS - send on/off message to " + this.name + ": " + value);
    var command = (value == '1') ? 'On' : 'Off';
    if (typeof this.platform.ws != 'undefined') {
      this.platform.ws.sendCommand(this.uuidAction, command);
    }
    callback();

};

module.exports = DimmerItem;
