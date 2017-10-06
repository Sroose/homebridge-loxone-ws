"use strict";

var WSListener = require('../libs/WSListener.js');

var AbstractItem = function(widget,platform,homebridge) {
    this.platform = platform;
    this.widget =  widget;
    this.homebridge = homebridge;
    this.log = this.platform.log;
    this.name = widget.name;

    //other variables used by child classes
    this.setFromLoxone = false;

    //Add as ACCESSORY (parent class)
    AbstractItem.super_.call(this, this.name, homebridge.hap.uuid.generate(String(this.widget.name)));

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