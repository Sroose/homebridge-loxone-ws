import request from "request";

class LightSensorItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.uuidAction = widget.uuidAction;
        this.lightlevel = 0;

        LightSensorItem.super_.call(this, widget, platform, homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
    }

    callBack(value) {
        //function that gets called by the registered ws listener

        //console.log("Got new state for Light Level: " + value);

        this.lightlevel = value;

        //also make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.CurrentAmbientLightLevel)
            .setValue(this.lightlevel);
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.LightSensor();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentAmbientLightLevel)
            .on('get', this.getItemState.bind(this))
            .setValue(this.lightlevel);

        return otherService;
    }

    getItemState(callback) {
       callback(undefined, this.lightlevel);
    }
}

export default LightSensorItem;