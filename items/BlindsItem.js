"use strict";

var request = require("request");

var BlindsItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a dimmer, use the uuidAction
    this.stateUuid = widget.states.position; //a blind always has a state called position, which is the uuid which will receive the event to read
    this.initialValue = true;
    this.inControl = false;

    //100 means fully open
    this.currentPosition = 100;
    this.targetPosition = 100;
    this.startedPosition = 100;

    BlindsItem.super_.call(this, widget,platform,homebridge);

    this.positionState = this.homebridge.hap.Characteristic.PositionState.STOPPED;
};

// Register a listener to be notified of changes in this items value
BlindsItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

BlindsItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for blind " + value);

    //incomign values from blinds are decimal (0 - 1)
    value *= 100;
    //in Homekit, 100% means OPEN while in Loxone this means CLOSED: reverse
    value = parseInt(100 - value);

    if(this.initialValue) {
        //this is the initial value. therfore, also set current targetValue on the same
        this.targetPosition = value;
        this.initialValue = false;
    }
    //if extenal actor changed the blinds, it's important that we set the targetvalue to the new real situation
    if(!this.inControl) {
        this.targetPosition = value;
    }

    //define states for Homekit
    var delta = Math.abs(parseInt(value) - this.targetPosition),
        ps = this.homebridge.hap.Characteristic.PositionState.INCREASING;
    if (delta < 3) {
        //blinds don't always stop at the exact position, so take a margin of 3% here
        ps = this.homebridge.hap.Characteristic.PositionState.STOPPED;
    } else if (parseInt(value) > this.targetPosition){
        ps = this.homebridge.hap.Characteristic.PositionState.DECREASING;
    }

    this.currentPosition = value;

    //also make sure this change is directly communicated to HomeKit
    this.setFromLoxone = true;
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.PositionState)
        .setValue(ps);

     this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.TargetPosition)
        .setValue(parseInt(this.targetPosition));

    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.CurrentPosition)
        .setValue(value,
            function() {
                this.setFromLoxone = false;
            }.bind(this));

};

BlindsItem.prototype.getOtherServices = function() {

    //setting variable to skip update for intial value
    this.setInitialState = true;

    var otherService = new this.homebridge.hap.Service.WindowCovering();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentPosition)
        .on('get', this.getItemCurrentPosition.bind(this))
        .setValue(this.currentPosition);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.TargetPosition)
        .on('set', this.setItem.bind(this))
        .on('get', this.getItemTargetPosition.bind(this))
        .setValue(this.currentPosition);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.PositionState)
        .on('get', this.getItemPositionState.bind(this))
        .setValue(this.positionState);

    return otherService;
};

BlindsItem.prototype.getItemPositionState = function(callback) {
    callback(undefined,this.positionState);
};

BlindsItem.prototype.getItemTargetPosition = function(callback) {
    callback(undefined,this.targetPosition);
};

BlindsItem.prototype.getItemCurrentPosition = function(callback) {
    callback(undefined,this.currentPosition);
};

BlindsItem.prototype.setItem = function(value, callback) {

    //sending new state (pct closed) to loxone
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

    //set a flag that we're in control. this way we'll know if the action is coming from Homekit or from external actor (eg Loxone app)
    //this flag is removed after 20 seconds (increase if you have really long or slow blinds ;)
    this.inControl =true;
    setTimeout(function(){ self.inControl = false; }, 20000);

    this.startedPosition = this.currentPosition;
    this.targetPosition = parseInt(value);

    var command = 0;
    if (typeof value === 'boolean') {
        command = value ? 'FullUp' : 'FullDown';
    } else {
        //reverse again the value
        command = "ManualPosition/" + (100 - value);
    }
    this.log("[BLINDS] iOS - send message to " + this.name + ": " + command);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();

};

module.exports = BlindsItem;