"use strict";

var request = require("request");

var Alarm = function (widget, platform, homebridge) {

  this.platform = platform;
  this.uuidAction = widget.uuidAction;
  this.stateUuid = widget.states.armed;
  this.currentState = undefined;

  Alarm.super_.call(this, widget, platform, homebridge);
};

Alarm.prototype.initListener = function () {
  this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

Alarm.prototype.callBack = function (value) {
  this.currentState = value;
}

Alarm.prototype.getOtherServices = function () {
  var otherService = new this.homebridge.hap.Service.Switch();

  otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
    .on('set', this.setItemState.bind(this))
    .on('get', this.getItemState.bind(this))
    .updateValue(this.currentState == '1');

  return otherService;
};

Alarm.prototype.getItemState = function (callback) {
  callback(undefined, this.currentState == '1');
};

Alarm.prototype.onCommand = function () {
  return 'On';
};

Alarm.prototype.setItemState = function (value, callback) {
  var self = this;

  var command = (value == '1') ? this.onCommand() : 'Off';
  this.log("[Alarm] iOS - send message to " + this.name + ": " + command);
  this.platform.ws.sendCommand(this.uuidAction, command);
  callback();

};

module.exports = Alarm;
