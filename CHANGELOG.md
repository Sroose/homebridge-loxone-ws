# Change Log

## 1.0.5 (2018-04-02)

**Merged pull requests:**

- [PR20](https://github.com/Sroose/homebridge-loxone-ws/pull/20) "ColorpickerItem fixes"
- [PR28](https://github.com/Sroose/homebridge-loxone-ws/pull/28) "Fix bug in DimmerItem that tries to getItemState before connection established"

**Bugfixes:**

- [Issue 13](https://github.com/Sroose/homebridge-loxone-ws/issues/13) "No actual responses from loxone miniserver" fixed
- [Issue 15](https://github.com/Sroose/homebridge-loxone-ws/issues/15) "works incorrectly after a while" fixed
- [Issue 23](https://github.com/Sroose/homebridge-loxone-ws/issues/23) "Error on initializing accessory" fixed
- Reconnect after Loxone connection drops. TODO: find root cause of frequent drops in Loxone 9.3

**Added features:**

- Supports latest Loxone 9.3
- Added [Moods](https://www.loxone.com/enen/kb/lighting-controller-v2/)
- Added (UNTESTED) ContactSensor, DoorBell, Gate, HumiditySensor, LightSensor, MotionSensor, TimedSwitch - by [Daniel Burton](https://github.com/dgburton)

## 1.0.4 (2017-10-06)

**Bugfixes:**

- [Issue 16](https://github.com/Sroose/homebridge-loxone-ws/issues/16) "Not working with release of Loxone 9.0.9.26" fixed
- [Issue 11](https://github.com/Sroose/homebridge-loxone-ws/issues/11) "Plugin doesn't support multiple accessories with the same name" fixed
- Added support for new LightControllerV2s ColorPickerV2


## 1.0.2 (2016-12-11)

**Bugfixes:**

- WS listener reconnect on connection failure wouldn't work because of code issue
- [Issue 5](https://github.com/Sroose/homebridge-loxone-ws/issues/5) "Problem turning off RGBW Dimmer" fixed
