import request from "request";

class TimedSwitchItem {
    constructor(widget, platform, homebridge) {

        this.platform = platform;
        this.uuidAction = widget.uuidAction; //to control a switch, use the uuidAction
        this.currentState = undefined; //will be 0 or 1 for Switch

        TimedSwitchItem.super_.call(this, widget,platform,homebridge);
    }

    // Register a listener to be notified of changes in this items value
    initListener() {
        //this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
        this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
    }

    callBack(value) {
        //function that gets called by the registered ws listener
        if (value == -1) {
            //console.log("Got new state for Timed Switch: On");
        } else if (value == 0) {
            //console.log("Got new state for Timed Switch: Off");
        } else if (value > 0) {
            //console.log("Got new state for Timed Switch: Countdown " + value + "s");
        }

        this.currentState = (value !== 0);

        //console.log('set currentState to: ' + this.currentState)

        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.currentState);
    }

    getOtherServices() {
        const otherService = new this.homebridge.hap.Service.Switch();

        otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
            .on('set', this.setItemState.bind(this))
            .on('get', this.getItemState.bind(this))
            //.updateValue(this.currentState == '1');

        return otherService;
    }

    getItemState(callback) {
        //returns true if currentState is 1
        callback(undefined, this.currentState);
    }

    setItemState(value, callback) {

        //sending new state to loxone
        //added some logic to prevent a loop when the change because of external event captured by callback



        let command = 0;
        if (value == true) {
            //this.log('perm on ***');
            command = 'On';//-1; // perm on
        } else {
            //this.log('off ***');
            command = 'Off';//0; // off
        }

        //this.log('setItemState value: ' + value);
        //this.log('setItemState command: ' + command);

        this.log(`[timedswitch] iOS - send message to ${this.name}: ${command}`);
        this.platform.ws.sendCommand(this.uuidAction, command);
        callback();

    }
}

export default TimedSwitchItem;