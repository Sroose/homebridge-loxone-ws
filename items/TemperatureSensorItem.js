import request from "request";

class TemperatureSensorItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.uuidAction = widget.uuidAction;
        this.currentTemperature = undefined;

        TemperatureSensorItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
    }

    callBack(value) {
        //function that gets called by the registered ws listener
        this.currentTemperature = value;

        //also make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.CurrentTemperature)
            .setValue(this.currentTemperature);
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.TemperatureSensor();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentTemperature)
            .on('get', this.getItemState.bind(this))
            .setValue(this.currentTemperature);

        return otherService;
    }

    getItemState(callback) {
       callback(undefined, this.currentTemperature);
    }
}

export default TemperatureSensorItem;