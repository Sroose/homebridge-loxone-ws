import request from "request";

class MotionSensorItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.uuidAction = widget.uuidAction;
        this.motiondetected = false;

        MotionSensorItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
    }

    callBack(value) {
        //function that gets called by the registered ws listener

        //console.log("Got new state for Motion: " + value);

        this.motiondetected = value;

        //also make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.MotionDetected)
            .setValue(this.motiondetected);
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.MotionSensor();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.MotionDetected)
            .on('get', this.getItemState.bind(this))
            .setValue(this.motiondetected);

        return otherService;
    }

    getItemState(callback) {
       callback(undefined, this.motiondetected);
    }
}

export default MotionSensorItem;