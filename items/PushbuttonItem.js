import request from "request";

class PushbuttonItem {
    constructor(widget, platform, homebridge) {
        PushbuttonItem.super_.call(this, widget,platform,homebridge);
    }

    //To model a pushbutton, we use a switch of which we set the state back off after a small delay

    callBack(value) {
        //function that gets called by the registered ws listener
        //console.log("Got new state for pushbutton " + value);
        this.currentState = value;

        //also make sure this change is directly communicated to HomeKit
        this.setFromLoxone = true;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .setValue(this.currentState == '1');

        //and then set state back to off, since pushbuttons don't keep states
        setTimeout(() => {
            this.currentState = false;
            this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .setValue(false,
                () => {
                    this.setFromLoxone = false;
                }
            );
        }, 1000);

    }

    onCommand() {
        return (
            //override On command
            "Pulse"
        );
    }
}

export default PushbuttonItem;