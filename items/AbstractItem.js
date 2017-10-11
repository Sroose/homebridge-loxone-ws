"use strict";

var WSListener = require('../libs/WSListener.js');

var AbstractItem = function(widget,platform,homebridge) {
    this.platform = platform;
    this.widget =  widget;
    this.homebridge = homebridge;
    this.log = this.platform.log;
    this.name = widget.name;
    this.UUID = homebridge.hap.uuid.generate(String(widget.uuidAction));
    
    // provide explicit UUID to prevent automatic UUID generation by homebridge (which would fail because of possibly equal item name)
    this.uuid_base = this.UUID;

    //other variables used by child classes
    this.setFromLoxone = false;
    
	// console.log("Generating new homebridge accessory '" + this.name + "' with UUID: " + this.UUID + " from accessory with ID: " + widget.uuidAction);

    //Add as ACCESSORY (parent class)
    AbstractItem.super_.call(this, this.name, this.UUID);

};

AbstractItem.prototype.getServices = function() {
    this.initListener();
    this.setInitialState = true;
    this.informationService = this.getInformationServices();
    this.otherService = this.getOtherServices();
    return [this.informationService, this.otherService];
};

AbstractItem.prototype.getOtherServices = function() {
    return null;
};

AbstractItem.prototype.getInformationServices = function() {
    var informationService = new this.homebridge.hap.Service.AccessoryInformation();

    informationService
        .setCharacteristic(this.homebridge.hap.Characteristic.Manufacturer, this.manufacturer)
        .setCharacteristic(this.homebridge.hap.Characteristic.Model, this.model)
        .setCharacteristic(this.homebridge.hap.Characteristic.SerialNumber, this.serialNumber)
        .setCharacteristic(this.homebridge.hap.Characteristic.Name, this.name);
    return informationService;
};

module.exports = AbstractItem;