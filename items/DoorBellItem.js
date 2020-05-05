import request from "request";

class DoorBellItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.stateUuidActive = widget.states.active;

        this.currentstate = 0;

        DoorBellItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        this.platform.ws.registerListenerForUUID(this.stateUuidActive, this.callBackActive.bind(this));
    }

    callBackActive(value) {
        console.log(`Got new state for DoorBell: ${value}`);

        /*
        var new_doorstate = this.currentdoorstate;
        if (value == 1) {
            new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.OPENING;
            //console.log('OPENING');
        } else if (value == -1) {
            new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.CLOSING;
            //console.log('CLOSING');
        } else if (value == 0) {
            if ((this.currentdoorstate == this.homebridge.hap.Characteristic.CurrentDoorState.OPENING) || (this.currentdoorstate == this.homebridge.hap.Characteristic.CurrentDoorState.CLOSING)) {
                new_doorstate = this.homebridge.hap.Characteristic.CurrentDoorState.STOPPED;
                //console.log('STOPPED');
            }
        }

        if (new_doorstate != this.currentdoorstate) {
            this.currentdoorstate = new_doorstate;
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.CurrentDoorState)
                .updateValue(this.currentdoorstate);

        }

        // update the doors TargetState to match the direction that it is travelling
        if (new_doorstate == this.homebridge.hap.Characteristic.CurrentDoorState.OPENING) {
            this.targetdoorstate = this.homebridge.hap.Characteristic.CurrentDoorState.OPEN;
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.TargetDoorState)
                .updateValue(this.targetdoorstate);

        } else if (new_doorstate == this.homebridge.hap.Characteristic.CurrentDoorState.CLOSING) {
            this.targetdoorstate = this.homebridge.hap.Characteristic.CurrentDoorState.CLOSED;
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.TargetDoorState)
                .updateValue(this.targetdoorstate);

        }
        */
    }

    getOtherServices() {

        const otherService = new this.homebridge.hap.Service.Doorbell();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.ProgrammableSwitchEvent)
            .on('get', this.getState.bind(this));

        return otherService;
    }

    getState(callback) {
        callback(undefined, this.currentstate);
    }
}

export default DoorBellItem;