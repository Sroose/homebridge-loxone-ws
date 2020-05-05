import request from "request";

class ContactSensorItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.uuidAction = widget.uuidAction;
        this.isClosed = false;

        ContactSensorItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
    }

    callBack(value) {
        //function that gets called by the registered ws listener

        console.log(`Got new state for ContactSensor: ${value}`);

        this.isClosed = value;

        //also make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.ContactSensorState)
            .setValue(this.isClosed);
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.ContactSensor();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.ContactSensorState)
            .on('get', this.getItemState.bind(this))
            .setValue(this.isClosed);

        return otherService;
    }

    getItemState(callback) {
       callback(undefined, this.isClosed);
    }
}

export default ContactSensorItem;