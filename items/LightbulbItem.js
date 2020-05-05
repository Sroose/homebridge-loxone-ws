import request from "request";

class LightbulbItem {
    constructor(widget, platform, homebridge) {
        LightbulbItem.super_.call(this, widget,platform,homebridge);
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.Lightbulb();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
            .on('set', this.setItemState.bind(this))
            .on('get', this.getItemState.bind(this))
            .updateValue(this.currentState == '1');

        return otherService;
    }
}

export default LightbulbItem;