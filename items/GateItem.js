"use strict";

var request = require("request");

var GateItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.stateUuidPosition = widget.states.position;
    this.stateUuidActive = widget.states.active;

    this.currentdoorstate = homebridge.hap.Characteristic.CurrentDoorState.STOPPED;
    this.targetdoorstate = homebridge.hap.Characteristic.CurrentDoorState.STOPPED;

    GateItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
GateItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.stateUuidPosition, this.callBackPosition.bind(this));
    this.platform.ws.registerListenerForUUID(this.stateUuidActive, this.callBackActive.bind(this));
};

GateItem.prototype.callBackActive = function(value) {
    console.log("Got new state for GateActive: " + value);

    var new_doorstate = this.currentdoorstate;
    if (value == 1) {
        new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.OPENING;
        //console.log('OPENING');
    } else if (value == -1) {
        new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.CLOSING;
        //console.log('CLOSING');
    } else if (value == 0) {
        if ((this.currentdoorstate == this.homebridge.hap.Characteristic.CurrentDoorState.OPENING) || (this.currentdoorstate == this.homebridge.hap.Characteristic.CurrentDoorState.CLOSING)) {
            new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.STOPPED;
            //console.log('STOPPED');
        }
    }

    if (new_doorstate != this.currentdoorstate) {
        this.currentdoorstate = new_doorstate;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.CurrentDoorState)
            .updateValue(this.currentdoorstate);

    }

    // update the doors TargetState to match the direction that it is travelling
    if (new_doorstate == this.homebridge.hap.Characteristic.CurrentDoorState.OPENING) {
        this.targetdoorstate = this.homebridge.hap.Characteristic.CurrentDoorState.OPEN;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.TargetDoorState)
            .updateValue(this.targetdoorstate);

    } else if (new_doorstate == this.homebridge.hap.Characteristic.CurrentDoorState.CLOSING) {
        this.targetdoorstate = this.homebridge.hap.Characteristic.CurrentDoorState.CLOSED;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.TargetDoorState)
            .updateValue(this.targetdoorstate);

    }
};

GateItem.prototype.callBackPosition = function(value) {
    console.log("Got new state for GatePosition: " + value);

    var new_doorstate = this.currentdoorstate;
    if (value == 1) {
        new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.OPEN;
        this.targetdoorstate = new_doorstate;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.TargetDoorState)
            .updateValue(this.targetdoorstate);
        //console.log('OPEN');

    } else if (value == 0) {
        new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.CLOSED;
        this.targetdoorstate = new_doorstate;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.TargetDoorState)
            .updateValue(this.targetdoorstate);
        //console.log('CLOSED');

    } else if (value == 0.5) { // Loxone reports '0.5' when the gate position is indeterminate, maybe we should raise this a 'Obstruction Detected'?
        new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.STOPPED;
        //console.log('STOPPED');
    }

    if (new_doorstate != this.currentdoorstate) {
        this.currentdoorstate = new_doorstate;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.CurrentDoorState)
            .updateValue(this.currentdoorstate);
    }

    if (this.targetdoorstate == null) { // handle first load
        this.targetdoorstate = this.currentdoorstate;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.TargetDoorState)
            .updateValue(this.targetdoorstate);
    }    
};

GateItem.prototype.getOtherServices = function() {

    var otherService = new this.homebridge.hap.Service.GarageDoorOpener();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentDoorState)
        .on('get', this.getCurrentDoorState.bind(this))
        .updateValue(this.currentdoorstate);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.TargetDoorState)
        .on('set', this.setTargetDoorState.bind(this))
        .on('get', this.getTargetDoorState.bind(this))
        .updateValue(this.targetdoorstate);

    return otherService;
};

GateItem.prototype.getCurrentDoorState = function(callback) {
    callback(undefined, this.currentdoorstate);
};
GateItem.prototype.getTargetDoorState = function(callback) {
    callback(undefined, this.targetdoorstate);
};

GateItem.prototype.setTargetDoorState = function(value, callback) {

    if (value == this.homebridge.hap.Characteristic.CurrentDoorState.CLOSED) {
        this.targetdoorstate = this.homebridge.hap.Characteristic.CurrentDoorState.CLOSED;

    } else if (value == this.homebridge.hap.Characteristic.CurrentDoorState.OPEN) {
        this.targetdoorstate = this.homebridge.hap.Characteristic.CurrentDoorState.OPEN;

    }

    var command = 'open';
    if (this.targetdoorstate == this.homebridge.hap.Characteristic.CurrentDoorState.CLOSED) {
        command = 'close';
    } 

    this.log("[gate] iOS - send message to " + this.name + ": " + command);
    this.platform.ws.sendCommand(this.uuidAction, command);

    callback();
};

module.exports = GateItem;