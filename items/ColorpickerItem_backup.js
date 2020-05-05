"use strict";

var request = require("request");

var ColorItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a colorpicker, use the uuidAction
    this.stateUuid = widget.states.color; //a colorpicker always has a state called color, which is the uuid which will receive the event to read

    this.hue = 0;
    this.saturation = 0;
    this.brightness = 0;
    this.power = false;
    this.colortemperature = 0;
    this.lastsetmode = 'color';

    ColorItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
ColorItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

// transform Loxone color temperature (expressed in Kelvins 2700-6500k to Homekit values 140-500)
function loxoneToHomekitColorTemperature(ct, obj) {

    var minCtLoxone = 2700;
    var maxCtLoxone = 6500;

    var minCtHomekit = 153;
    var maxCtHomekit = 500;

    var percent = 1 - ((ct - minCtLoxone) / (maxCtLoxone - minCtLoxone));
    var newValue = Math.round(minCtHomekit + ((maxCtHomekit - minCtHomekit) * percent));

    //obj.log('loxoneToHomekitColorTemperature - Loxone Value: ' + ct);
    //obj.log('loxoneToHomekitColorTemperature - Percent: ' + percent + '%');
    //obj.log('loxoneToHomekitColorTemperature - Homekit Value: ' + newValue);

    return newValue;
}

// transform Homekit color temperature (expressed 140-500 to Loxone values expressed in Kelvins 2700-6500k)
function homekitToLoxoneColorTemperature(ct, obj) {

    var minCtLoxone = 2700;
    var maxCtLoxone = 6500;

    var minCtHomekit = 153;
    var maxCtHomekit = 500;

    var percent = 1 - ((ct - minCtHomekit) / (maxCtHomekit - minCtHomekit));
    var newValue = Math.round(minCtLoxone + ((maxCtLoxone - minCtLoxone) * percent));

    //obj.log('homekitToLoxoneColorTemperature - Homekit Value: ' + ct);
    //obj.log('homekitToLoxoneColorTemperature - Percent: ' + percent + '%');
    //obj.log('homekitToLoxoneColorTemperature - Loxone Value: ' + newValue);

    return newValue;
}

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return {
        h : h,
        s : s,
        l : l
    }
}

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  //return [ h, s, v ];

  return {
        h : h,
        s : s,
        v : v
    }

}

// From http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
// Start with a temperature, in Kelvin, somewhere between 1000 and 40000.  (Other values may work,
//  but I can't make any promises about the quality of the algorithm's estimates above 40000 K.)
function colorTemperatureToRGB(kelvin){
    var temp = kelvin / 100;
    var red, green, blue;

    if( temp <= 66 ){ 

        red = 255; 
        
        green = temp;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;

        
        if( temp <= 19){

            blue = 0;

        } else {

            blue = temp-10;
            blue = 138.5177312231 * Math.log(blue) - 305.0447927307;

        }

    } else {

        red = temp - 60;
        red = 329.698727446 * Math.pow(red, -0.1332047592);
        
        green = temp - 60;
        green = 288.1221695283 * Math.pow(green, -0.0755148492 );

        blue = 255;

    }


    return {
        r : parseInt(clamp(red,   0, 255)),
        g : parseInt(clamp(green, 0, 255)),
        b : parseInt(clamp(blue,  0, 255))
    }
}

function clamp( x, min, max ) {
    if(x<min){ return min; }
    if(x>max){ return max; }
    return x;
}

ColorItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener
    console.log("Got new state for Color: " + value);

    //incoming value is a HSV string that needs to be parsed
    var m;
    if (m = value.match(/^\W*hsv?\(([^)]*)\)\W*$/i)) {
        var params = m[1].split(',');
        var re = /^\s*(\d*)(\.\d+)?\s*$/;
        var mH, mS, mV;
        if (
            params.length >= 3 &&
            (mH = params[0].match(re)) &&
            (mS = params[1].match(re)) &&
            (mV = params[2].match(re))
        ) {
            var h = parseFloat((mH[1] || '0') + (mH[2] || ''));
            var s = parseFloat((mS[1] || '0') + (mS[2] || ''));
            var v = parseFloat((mV[1] || '0') + (mV[2] || ''));

            this.lastsetmode = 'color';

            this.hue = parseInt(h);
            this.saturation = parseInt(s);
            this.brightness = parseInt(v);
            this.power = this.brightness > 0;

            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.Hue)
                .updateValue(this.hue);
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.Saturation)
                .updateValue(this.saturation);
        }


    } else if (m = value.match(/^\W*temp?\(([^)]*)\)\W*$/i)) {
        var params = m[1].split(',');

        this.lastsetmode = 'colortemperature';

        // could also be a colour temp update in the form: temp(100,4542)
        this.brightness = parseInt(params[0]);
        this.colortemperature = loxoneToHomekitColorTemperature(parseInt(params[1]), this);
        this.power = this.brightness > 0;

        //this.log('');
        //this.log('CT (loxone)  : ' + parseInt(params[1]));
        //this.log('CT (homekit) : ' + this.colortemperature);
        var rgb = colorTemperatureToRGB(parseInt(params[1]));
        //this.log('RGB          : ' + rgb.r + ' ' + rgb.g + ' ' + rgb.b);
        var hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        var new_hue = parseInt(360 * hsv.h);
        var new_sat = parseInt(hsv.s * 100);

        //this.log('HSV          : ' + hsv.h + ' ' + hsv.s + ' ' + hsv.v);
        this.log('hue: ' + new_hue + ' sat: ' + new_sat);
        //this.log('');

        // TODO - update the color Hue and Sat variables here also, from formula of the color temp
        
        this.hue = new_hue;
        this.saturation = new_sat;

        
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.Hue)
            .updateValue(this.hue);
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.Saturation)
            .updateValue(this.saturation);
        
        
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.ColorTemperature)
            .updateValue(this.colortemperature);
        
        

    }

    //also make sure this change is directly communicated to HomeKit
    
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .updateValue(this.power);
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .updateValue(this.brightness);
    

};

ColorItem.prototype.getOtherServices = function() {

    var otherService = new this.homebridge.hap.Service.Lightbulb();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemPowerState.bind(this))
        .on('get', this.getItemPowerState.bind(this))
        .updateValue(this.power);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .on('set', this.setItemBrightnessState.bind(this))
        .on('get', this.getItemBrightnessState.bind(this))
        .updateValue(this.brightness);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Hue)
        .on('set', this.setItemHueState.bind(this))
        .on('get', this.getItemHueState.bind(this))
        .updateValue(this.hue);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Saturation)
        .on('set', this.setItemSaturationState.bind(this))
        .on('get', this.getItemSaturationState.bind(this))
        .updateValue(this.saturation);

    otherService.addOptionalCharacteristic(this.homebridge.hap.Characteristic.ColorTemperature);
    otherService.getCharacteristic(this.homebridge.hap.Characteristic.ColorTemperature)
        .on('set', this.setItemColorTemperatureState.bind(this))
        .on('get', this.getItemColorTemperatureState.bind(this))
        .setProps({
            minValue: 153,
            maxValue: 500
          })
        .updateValue(this.colortemperature);

    return otherService;
};

ColorItem.prototype.getItemColorTemperatureState = function(callback) {
    callback(undefined, this.colortemperature);
};
ColorItem.prototype.getItemPowerState = function(callback) {
    callback(undefined, this.power);
};
ColorItem.prototype.getItemBrightnessState = function(callback) {
    callback(undefined, this.brightness);
};
ColorItem.prototype.getItemHueState = function(callback) {
    callback(undefined, this.hue);
};
ColorItem.prototype.getItemSaturationState = function(callback) {
    callback(undefined, this.saturation);
};

ColorItem.prototype.setItemColorTemperatureState = function(value, callback) {
    this.log('setItemColorTemperatureState: ' + value);
    this.lastsetmode = 'colortemperature';
    this.colortemperature = value;
    this.setColorState(callback);
};

ColorItem.prototype.setItemPowerState = function(value, callback) {

    //sending new power state to loxone
    if (!value) {
        //loxone does not understand 'on' or 'off', we interpret Homekit 'off' as setting brightness to 0
        this.brightness = 0;
        this.setColorState(callback);
    } else {
        callback();
    }

};

ColorItem.prototype.setItemHueState = function(value, callback) {
    this.log('setItemHueState: ' + value);
    this.lastsetmode = 'color';
    this.hue = parseInt(value);
    this.setColorState(callback);
};

ColorItem.prototype.setItemSaturationState = function(value, callback) {
    this.log('setItemSaturationState: ' + value);
    this.lastsetmode = 'color';
    this.saturation = parseInt(value);
    this.setColorState(callback);
};

ColorItem.prototype.setItemBrightnessState = function(value, callback) {
    this.brightness = parseInt(value);
    this.power = this.brightness > 0;
    this.setColorState(callback);
};

ColorItem.prototype.setColorState = function(callback) {
    //compose hsv string

    //compose hsv or temp string
    var command = '';
    if (this.lastsetmode == 'color') {
        command = "hsv(" + this.hue + "," + this.saturation + "," + this.brightness + ")";
        
    } else if (this.lastsetmode == 'colortemperature') {
        command = "temp(" + this.brightness + "," + homekitToLoxoneColorTemperature(this.colortemperature, this) + ")";

    }

    //var command = "hsv(" + this.hue + "," + this.saturation + "," + this.brightness + ")";
    this.log("[color] iOS - send message to " + this.name + ' ' + command);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();
};

module.exports = ColorItem;


