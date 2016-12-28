# homebridge-loxone-ws
Websocket based Loxone plugin for homebridge

This is a Loxone plugin for [Homebridge](https://github.com/nfarina/homebridge)
The plugin will automatically retrieve and communicate with all these items from your Loxone setup:
  - Lights (Switches, Dimmers and Color leds)
  - Other Switches
  - Pushbuttons
  - Window blinds
  - Temperature sensors
  - (other types can be added easily)

The only configuration needed is the credentials to your Loxone miniserver.

### Benefits

* Realtime and very fast 2-way updates by using the websocket connection
* One-touch deployment through automatic import of Loxone controls

### Prerequisites
[Homebridge](https://github.com/nfarina/homebridge)
Follow all the installation steps there.

### Installation

Install the plugin through npm or download the files from here.

```sh
$ sudo npm install -g homebridge-loxone-ws
```
Note: the plugin requires extra node modules, but these should be automatically installed:
- node-lox-ws-api
- request

##### Homebridge config.json

Add the platform section to your Homebridge config.json (usually in ~/.homebridge):
```
{
    "bridge": {
        "name": "Homebridge",
        "username": "CA:AA:12:34:56:78",
        "port": 51826,
        "pin": "012-34-567"
    },

    "description": "Your config file.",

    "platforms": [
        {
            "platform": "LoxoneWs",
            "name": "Loxone",
            "host": "192.168.1.2",
            "port": "12345",
            "username": "homebridge",
            "password": "somepassword"
        }
    ]
}
```
Replace fields
* **host** by the IP of your loxone miniserver
* **port** by the port of your miniserver (use 80 if no special port)
* **username** by the Loxone username
* **password** by the Loxone password

I strongly suggest to create a dedicate Loxone user through Loxone Config (eg homebridge). Like this you can restrict access to sensitive items or filter out unneeded controls.

### Assumptions

To create the correct accessory type from Loxone items, some attribute parsing is required. (Eg a Loxone Switch can be a Switch or a LightBulb, and InfoOnlyAnalog type can be a temperature sensor but also anything else.) This is covered in the checkCustomAttrs function in ItemFactory. Adapt it to your needs. Currently these assumptions are made:
* temperature sensor names start with 'Temperat'
* light switches are in a Loxone category using the lightbulb icon

The controls will be named like you named them in Loxone. Rename them through the iOS Home app to make it more intuitive for using with Siri. Eg LIGHT_KITCHEN can be renamed to 'main light' and added to room Kitchen. Then you can ask Siri to 'turn on the main light in the kitchen'.

### Limitations

**rooms**
The Homebridge/HAP protocol does currently not allow attaching the Loxone rooms to the accessories. That is a manual action to be done once using the IOS Home app (or the Eve app which is much more user-friendly).

_Special note: organizing into rooms can be done from Eve, but renaming the items should (unfortunately) be done from the IOS Home app. Name changes in Eve are not reflected in Home and thus not known by Siri._

**100 items**
HomeKit has a limit of 100 accessories per bridge. If you have a large Loxone setup, try to filter unneeded items out either through Loxone access or in the checkCustomAttrs function.

**pushbuttons**
Since Homekit has no pushbutton concept, I implemented pushbuttons as switches in Homekit. Telling Siri to put them On will send a pulse to the pushbutton. In Homekit, they will appear to be On for a second.

### Advanced

The Event type is foreseen for your convenience, but not currently used. It can be used for pushbuttons when you're only interested in reading from Homekit and not controlling it. That could be useful for setting triggers, eg a Pushbutton event which causes a Homekit scene to become active.


License
----

The plugin is released under MIT license, which means you can do whatever you want with it as long as you give credit.

Credits
----
Attribution goes towards [Tommaso Marchionni](https://github.com/tommasomarchionni). The structure of this code is based on his [openHAB plugin](https://github.com/tommasomarchionni/homebridge-openHAB).

The original HomeKit API work was done by [Khaos Tian](https://github.com/KhaosT) in his [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS) project.

The [homebridge](https://github.com/nfarina/homebridge) component on which this plugin is built was created by [Nick Farina](https://github.com/nfarina).

I've made use of the [NodeJS Loxone websocket API](https://github.com/alladdin/node-lox-ws-api) created by [Ladislav Dokulil](https://github.com/alladdin)
