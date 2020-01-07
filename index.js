var rcswitch = require('rcswitch4');

var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-rcswitch4", "RCSwitch", RadioSwitch);
}

function RadioSwitch(log, config) {

    if (config.name  === undefined) {
        return log("Name missing from configuration.");
    }

    if ((config.onCode !== undefined) && (config.offCode !== undefined)) {
        if (typeof(config.onCode) === "string") {
            // If code is a string, it should be binary and don't need bit length
            var switchOn = rcswitch.send.bind(rcswitch, config.onCode);
        } else if (typeof(config.onCode) === "number") {
            var bLength = config.bitLength || 24;
            var switchOn = rcswitch.send.bind(rcswitch, config.onCode, bLength);
        }
        if (typeof(config.offCode) === "string") {
            // If code is a string, it should be binary and don't need bit length
            var switchOff = rcswitch.send.bind(rcswitch, config.offCode);
        } else if (typeof(config.offCode) === "number") {
            var bLength = config.bitLength || 24;
            var switchOff = rcswitch.send.bind(rcswitch, config.offCode, bLength);
        }
    } else if ((config.systemcode != undefined) && (config.unitcode != undefined)) {
        var switchOn = rcswitch.switchOn.bind(rcswitch, config.systemcode, config.unitcode);
        var switchOff = rcswitch.switchOff.bind(rcswitch, config.systemcode, config.unitcode);
    } else {
        return log("Configuration must include either both an on code and an off code OR " +
                "both a systemcode and a unitcode (or can have all of them), but " +
                "doesn't appear to include at least one of these pairs.");
    }

    var informationService = new Service.AccessoryInformation();

    informationService
        .setCharacteristic(Characteristic.Name, "node-rcswitch4")
        .setCharacteristic(Characteristic.Manufacturer, "jdrucey")
        .setCharacteristic(Characteristic.Model, "v1.4.2")
        .setCharacteristic(Characteristic.SerialNumber, "0000000001");

    var state = false;
    var switchService = new Service.Switch(config.name);

    switchService
        .getCharacteristic(Characteristic.On)
        .on('set', function(value, callback) {
            state = value;
    		rcswitch.enableTransmit(config.pin || 17);
            rcswitch.setProtocol(config.protocol || 1);
            rcswitch.setPulseLength(config.pulseLength || 190);
            rcswitch.setRepeatTransmit(config.repeats || 10);
            if (state) {
	            if ((config.systemcode != undefined) && (config.unitcode != undefined)) {
                	log("Switching on " + config.systemcode + "." + config.unitcode + " (" + config.name + ") at protocol " + config.protocol);
                } else {
	                log("Switching on " + config.onCode + " (" + config.name + ") at protocol " + config.protocol);
                }
                switchOn();
            } else {
	            if ((config.systemcode != undefined) && (config.unitcode != undefined)) {
                	log("Switching off " + config.systemcode + "." + config.unitcode + " (" + config.name + ") at protocol " + config.protocol);
                } else {
                	log("Switching off " + config.offCode + " (" + config.name + ") at protocol " + config.protocol);
                }
                switchOff();
            }
            callback();
        });

    switchService
        .getCharacteristic(Characteristic.On)
        .on('get', function(callback){
            callback(null, state);
        });

    this.services = [ informationService, switchService ];
}


RadioSwitch.prototype = {
    getServices : function (){
        return this.services;
    }
}
