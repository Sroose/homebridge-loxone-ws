const moduleexports = module.exports = {};
moduleexports.AbstractItem = require('../items/AbstractItem.js');
//Important: name the exports identical to Loxone type to have an automatic match
//If not possible, define in checkCustomAttrs which will override in certain cases
moduleexports.Switch = require('../items/SwitchItem.js');
moduleexports.Lightbulb = require('../items/LightbulbItem.js');
moduleexports.Outlet = require('../items/Outlet.js');

moduleexports.Factory = function(LoxPlatform, homebridge) {
    this.platform = LoxPlatform;
    this.log = this.platform.log;
    this.homebridge = homebridge;
    this.itemList = {};
    this.catList = {};
    this.roomList = {};
    //this.uniqueIds = [];
};

//TODO: we could also get this information from the websocket, avoiding the need of an extra request.

moduleexports.Factory.prototype.sitemapUrl = function() {
    let serverString = this.platform.host;
    const serverPort = this.platform.port;
    if (this.platform.username && this.platform.password) {
        serverString = `${encodeURIComponent(this.platform.username)}:${encodeURIComponent(this.platform.password)}@${serverString}:${serverPort}`;
    }

    return `${this.platform.protocol}://${serverString}/data/LoxApp3.json`;
};

moduleexports.Factory.prototype.parseSitemap = function(jsonSitemap) {

    //this is the function that gets called by index.js
    //first, parse the Loxone JSON that holds all controls
    moduleexports.Factory.prototype.traverseSitemap(jsonSitemap, this);
    //now convert these controls in accessories
    const accessoryList = [];

    for (const key in this.itemList) {
        if (this.itemList.hasOwnProperty(key)) {
            //process additional attributes
            this.itemList[key] = moduleexports.Factory.prototype.checkCustomAttrs(this, key, this.platform, this.catList);

            if (!(this.itemList[key].type in moduleexports)){
                continue;
            }

            const accessory = new moduleexports[this.itemList[key].type](this.itemList[key], this.platform, this.homebridge);

            if (accessoryList.length > 99) {
                // https://github.com/nfarina/homebridge/issues/509
            } else {
                accessoryList.push(accessory);
            }

        }
    }

    this.log(`Platform - Total accessory count ${accessoryList.length}.`);
    return accessoryList;
};


moduleexports.Factory.prototype.checkCustomAttrs = (factory, itemId, platform, catList) => {
    const item = factory.itemList[itemId];
    //this function will make accesories more precise based on other attributes
    //eg, all InfoOnlyAnalog items which start with the name 'Temperat' are considered temperature sensors

    if (item.name.startsWith('Temperat')) {
        item.type = "TemperatureSensor";

    } if (item.name.indexOf('Steckd') !== -1) {
        item.type = "Outlet";

    }

    item.manufacturer = "Loxone";

    return item;
};


moduleexports.Factory.prototype.traverseSitemap = (jsonSitmap, factory) => {

    //this function will simply add every control and subControl to the itemList, holding all its information
    //it will also store category information, as we will use this to decide on correct Item Type
    for (const sectionKey in jsonSitmap) {
        if (jsonSitmap.hasOwnProperty(sectionKey)) {
            if (sectionKey === "cats") {
                const cats = jsonSitmap[sectionKey];
                for (const catUuid in cats) {
                    if (cats.hasOwnProperty(catUuid)) {
                        factory.catList[catUuid] = cats[catUuid];
                    }
                }
            } else if (sectionKey === "controls") {
                const controls = jsonSitmap[sectionKey];
                for (const controlUuid in controls) {
                    if (controls.hasOwnProperty(controlUuid)) {
                        const control = controls[controlUuid]

                        factory.itemList[controlUuid] = control;

                        // Check if the control has any subControls like LightController(V2)
                        if (control.subControls) {
                            for (const subControlUuid in control.subControls) {
                                if (control.subControls.hasOwnProperty(subControlUuid)) {
                                    const subControl = control.subControls[subControlUuid];
                                    subControl.parentType = control.type;

                                    factory.itemList[subControlUuid] = subControl;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};