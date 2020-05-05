import request from "request";

class LightControllerV2MoodSwitchItem {
    constructor(widget, platform, homebridge) {
        this.platform = platform;
        this.uuidAction = widget.uuidAction;
        this.stateUuidActiveMoods = widget.states.activeMoods;
        this.mood = widget.mood;
        this.uuidActionOriginal = widget.uuidActionOriginal;

        this.currentState = undefined;

        LightControllerV2MoodSwitchItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.stateUuidActiveMoods, this.callBackActiveMoods.bind(this));
    }

    callBackActiveMoods(value) {
        this.currentState = (value.includes(this.mood.id));
        //console.log('Mood ' + this.mood.name + ': IsOn? ' + this.currentState);

        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.currentState);
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.Switch();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
            .on('set', this.setItemState.bind(this))
            .on('get', this.getItemState.bind(this))

        return otherService;
    }

    getItemState(callback) {
        callback(undefined, this.currentState);
    }

    setItemState(value, callback) {
        if (value == true) {
            // update local state
            this.currentState = true;
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.On)
                .updateValue(this.currentState);

            // send the mood change command to Loxone
            const command = `changeTo/${this.mood.id}`;
            //this.log("[LightControllerV2MoodSwitch] Send message to " + this.name + "uuidAction: '" + this.uuidActionOriginal + "' Command: '" + command + "'");
            this.platform.ws.sendCommand(this.uuidActionOriginal, command);

        } else if (this.currentState == true) {
            //this.log("[LightControllerV2MoodSwitch] Asking to be turned off, but it's currently on, need to cancel. " + this.name + "uuidAction: '" + this.uuidActionOriginal);

            // if we are trying to turn this Off, and we're currently On, then we cancel the action
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.On)
                .setValue(this.currentState);

        }

        callback();

    }
}

export default LightControllerV2MoodSwitchItem;