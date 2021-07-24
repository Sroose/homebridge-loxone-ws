const request = require("request");

const OutletItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a Outlet, use the uuidAction
    this.stateUuid = widget.states.active; //a Outlet always has a state called active, which is the uuid which will receive the event to read
    this.currentState = undefined; //will be 0 or 1 for Outlet

    OutletItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
OutletItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

OutletItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for Outlet: " + value);
    this.currentState = value;

    //also make sure this change is directly communicated to HomeKit
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .updateValue(this.currentState == '1');
};

OutletItem.prototype.getOtherServices = function() {
    var otherService = new this.homebridge.hap.Service.Outlet();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))
        .updateValue(this.currentState == '1');

    return otherService;
};

OutletItem.prototype.getItemState = function(callback) {
    //returns true if currentState is 1
    callback(undefined, this.currentState == '1');
};

OutletItem.prototype.onCommand = function() {
    //function to set the command to be used for On
    //for a Outlet, this is 'On', but subclasses can override this to eg Pulse
    return 'On';
};

OutletItem.prototype.setItemState = function(value, callback) {

    //sending new state to loxone
    //added some logic to prevent a loop when the change because of external event captured by callback

    var self = this;
	
    var command = (value == '1') ? this.onCommand() : 'Off';
    this.log("[Outlet] iOS - send message to " + this.name + ": " + command);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();

};

module.exports = OutletItem;