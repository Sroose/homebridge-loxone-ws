import request from "request";

class HumiditySensorItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.uuidAction = widget.uuidAction;
        this.currentHumidity = undefined;

        HumiditySensorItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
    }

    callBack(value) {
        //function that gets called by the registered ws listener
        this.currentHumidity = value;

        //also make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.CurrentRelativeHumidity)
            .setValue(this.currentHumidity);
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.HumiditySensor();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentRelativeHumidity)
            .on('get', this.getItemState.bind(this))
            .setValue(this.currentHumidity);

        return otherService;
    }

    getItemState(callback) {
       callback(undefined, this.currentHumidity);
    }
}

export default HumiditySensorItem;