"use strict";

var LoxoneWebSocket = require('node-lox-ws-api');

var WSListener = function(platform) {
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
        this.ws = new LoxoneWebSocket(this.host + ":" + this.port, this.username, this.password, true, 'Token-Enc');
        this.ws.connect();
    }

    this.ws.on('close_failed', function() {
        self.log("LOXONE WS: close failed");
    });

    this.ws.on('connect', function() {
        self.log("LOXONE WS: connect");
    });

    this.ws.on('connect_failed', function() {
      //throw new Error("LOXONE WS: connect failed");
      //connection can drop sometimes, try to reconnect silently (max once per 10 seconds)
      self.log("LOXONE WS: connection failed, reconnecting...");
      setTimeout(function(){ self.ws.connect(); }, 10000);
    });

    this.ws.on('connection_error', function(error) {
      //throw new Error("LOXONE WS: connection error: " + error);
      //connection can drop sometimes, try to reconnect silently (max once per 10 seconds)
      self.log("LOXONE WS: connection error, reconnecting..." + error);
      setTimeout(function(){ self.ws.connect(); }, 10000);
    });

    this.ws.on('send', function(message) {
        //self.log("LOXONE WS: message: "+ message);
    });

    this.ws.on('handle_message', function(message) {
        //self.log("LOXONE WS: handle message: " + JSON.stringify(message));
    });

    this.ws.on('message_header', function(message) {
        //self.log("LOXONE WS: message header: " + JSON.stringify(message));
    });

    this.ws.on('message_text', function(message) {
        //self.log("LOXONE WS: message text " + message);
    });

    this.ws.on('message_file', function(message) {
        //self.log("LOXONE WS: message file " + message);
    });

    this.ws.on('update_event_value', function(uuid, message) {
        //self.log("LOXONE WS: update value " + uuid + ":" + message);
        self.uuidCache[uuid] = message;
        if(typeof self.uuidCallbacks[uuid] != 'undefined') {
            for (var r = 0; r < self.uuidCallbacks[uuid].length; r++) {
                self.uuidCallbacks[uuid][r](message);
            }
        }
    });

    this.ws.on('update_event_text', function(uuid, message) {
        //self.log("LOXONE WS: update event text " + uuid + ":" + message);
        self.uuidCache[uuid] = message;
        //self.log('cache now contains ' + Object.keys(self.uuidCache).length + ' items');
        if(typeof self.uuidCallbacks[uuid] != 'undefined') {
            for (var r = 0; r < self.uuidCallbacks[uuid].length; r++) {
                self.uuidCallbacks[uuid][r](message);
            }
        }
    });

    this.ws.on('update_event_daytimer', function(uuid, message) {
        //self.log("LOXONE WS: update event timer " + uuid + ":" + message);
        if(typeof self.uuidCallbacks[uuid] != 'undefined') {
            for (var r = 0; r < self.uuidCallbacks[uuid].length; r++) {
                self.uuidCallbacks[uuid][r](message);
            }
        }
    });

    this.ws.on('update_event_weather', function(uuid, message) {
        //self.log("LOXONE WS: update event weather " + uuid + ":" + message);
        if(typeof self.uuidCallbacks[uuid] != 'undefined') {
            for (var r = 0; r < self.uuidCallbacks[uuid].length; r++) {
                self.uuidCallbacks[uuid][r](message);
            }
        }
    });

    this.ws.on('message_invalid', function(message) {
        self.log("LOXONE WS: message invalid " + message);
    });

    this.ws.on('keepalive', function(time) {
        self.log("LOXONE WS: keepalive " + time);
    });

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
    this.ws.send_cmd(uuid, command);
};

WSListener.prototype.getLastCachedValue = function (uuid) {
    return this.uuidCache[uuid];
};

module.exports = WSListener;
