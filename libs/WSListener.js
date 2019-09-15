"use strict";

var LxCommunicator = require('lxcommunicator'),
    uuid = getUUID(),
    deviceInfo = require('os').hostname(),
    WebSocketConfig = LxCommunicator.WebSocketConfig,
    config = new WebSocketConfig(WebSocketConfig.protocol.WS, uuid, deviceInfo, WebSocketConfig.permission.APP, false);

var WSListener = function(platform) {
    config.delegate = this;

    this.ws = undefined;
    this.log = platform.log;

    this.host = platform.host;
    this.port = platform.port;
    this.username = platform.username;
    this.password = platform.password;

    this.uuidCallbacks = [];

    // cache of the last value of any uuid received via the websocket
    this.uuidCache = [];

    this.startListener();
};

WSListener.prototype.startListener = function () {
    var self = this;

    if (typeof this.ws == 'undefined') {
        console.log("New WS: " + this.host + ":" + this.port);
        this.ws = new LxCommunicator.WebSocket(config);
        this.ws.open(this.host + ":" + this.port, this.username, this.password).then(function () {
            // Send a command, handle the response as you wish
            self.ws.send("jdev/sps/enablebinstatusupdate").then(function (respons) {
                self.log("LOXONE WS: Successfully executed '" + respons.LL.control + "' with code " + respons.LL.Code + " and value " + respons.LL.value);
            });
        }, function (e) {
            self.ws = undefined;
            self.log("LOXONE WS: connection failed, reconnecting...");
            setTimeout(function () {
                self.startListener();
            }, 10000);
        });
    }
};

WSListener.prototype.registerListenerForUUID = function (uuid, callback) {
    //function that the Item classes will call to listen in on a specific UUID message
   // console.log("Registering listener for UUID " + uuid);
    if (uuid in this.uuidCallbacks) {
        this.uuidCallbacks[uuid].push(callback);
    } else {
        this.uuidCallbacks[uuid] = [callback];
    }

    // if we already have a state cached for this uuid, broadcast it to all currently registered callbacks
    if (uuid in this.uuidCache) {
        for (var r = 0; r < this.uuidCallbacks[uuid].length; r++) {
            this.uuidCallbacks[uuid][r](this.uuidCache[uuid]);
        }
    }
};

WSListener.prototype.sendCommand = function (uuid, command) {
    self.ws.send("jdev/sps/io/" + uuid + "/" + command);
};

WSListener.prototype.getLastCachedValue = function (uuid) {
    return this.uuidCache[uuid];
};

// Delegate methods from LxCommunicator
WSListener.prototype.socketOnConnectionClosed = function socketOnConnectionClosed(socket, code) {
    switch (code) {
        case LxCommunicator.SupportCode.WEBSOCKET_OUT_OF_SERVICE:
        case LxCommunicator.SupportCode.WEBSOCKET_CLOSE:
        case LxCommunicator.SupportCode.WEBSOCKET_TIMEOUT:
            this.log("LOXONE WS: Miniserver is rebooting, reload structure after it is reachable again!");
            this.startListener();
            break;
        default:
            this.log("LOXONE WS: Websocket has been closed with code: " + code);
    }
};

WSListener.prototype.socketOnEventReceived = function socketOnEventReceived(socket, events, type) {
    var key = null,
        payload = null;
    // We only need to handle value and text events!
    if (type === LxCommunicator.BinaryEvent.Type.EVENT) {
        key = "value";
    } else if (type === LxCommunicator.BinaryEvent.Type.EVENTTEXT) {
        key = "text";
    }
    if (key) {
        events.forEach(function(event) {
            payload = event[key];
            if (payload !== undefined) {
                if(typeof this.uuidCallbacks[event.uuid] != 'undefined') {
                    for (var r = 0; r < this.uuidCallbacks[event.uuid].length; r++) {
                        this.log("Got state " + event.uuid + " -> " + payload);
                        this.uuidCallbacks[event.uuid][r](payload);
                    }
                }
            }
        }.bind(this));
    }
};

//=======================================================================================
// Helper functions
function getUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
//=======================================================================================

module.exports = WSListener;
