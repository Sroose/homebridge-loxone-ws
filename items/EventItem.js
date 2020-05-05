import request from "request";

class EventItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.stateUuid = widget.states.active; //an event always has a state called active, which is the uuid which will receive the event to read

        EventItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
    }

    callBack(value) {
        //function that gets called by the registered ws listener
        //console.log("Got new state for event " + value);

        //make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.ProgrammableSwitchEvent)
            .setValue(value == '1');
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.StatelessProgrammableSwitch();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.ProgrammableSwitchEvent);

        return otherService;
    }
}

export default EventItem;