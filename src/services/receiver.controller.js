// Onkyo.js
const Promise = require('bluebird');
const {OnkyoDiscover, Onkyo} = require('onkyo.js');
const onkyo = new Onkyo({ip: '192.168.1.104'});
// Command reference
// https://github.com/jupe/onkyo.js/blob/master/sample/control.js

class ReceiverController {
    // Receiver Controller Singleton
    constructor() {
      if (ReceiverController.instance) {
        return ReceiverController.instance;
      }
      ReceiverController.instance = this;
    
      console.log('ReceiverController constructor');
      this.connect();
      return this;
    }
  
    connect () {

    }

    test() {
        // Test comm with onkyo
        // STREAM, GAME - target input modes

        console.log('Test Onkyo in');

        onkyo.getDeviceState()
        .then((state) => {
            console.log('onkyo state: ' + JSON.stringify(state));
        })
        .then(() => Promise.delay(500))
        .then(() => onkyo.isOn().then((onkyo) => {
            console.log(`Detected On: ${onkyo.toString()}`);
        }))
        .then(() => Promise.delay(500))
        .then(() => onkyo.getSource().then((onkyo) => {
            console.log(`Detected Source: ${onkyo.toString()}`);
        }))
        .then(() => Promise.delay(500))
        .then(() => onkyo.isOff().then((onkyo) => {
            console.log(`Detected Off: ${onkyo.toString()}`);
        }));
        /*
        .then(() => Promise.delay(500))
        .then(() => onkyo.pwrOn())
        .catch((error) => {
            console.log('Onkyo error: ' + error);
            process.exit();
        });
        */

        /*
        onkyo.isOn().then((onkyo) => {
        console.log(`Detected On: ${onkyo.toString()}`);
        });    
        onkyo.getSource().then((onkyo) => {
        console.log(`Detected Source: ${onkyo.toString()}`);
        });
        onkyo.isOff().then((onkyo) => {
        console.log(`Detected Off: ${onkyo.toString()}`);
        });

        onkyo.pwrOff().then((onkyo) => {
        console.log(`Power Off: ${onkyo.toString()}`);
        });*/


        /*
        onkyo.on('connected', () => console.log('connected'));
        onkyo.getDeviceState()
        .then((state) => {
            console.log(state);
        })
        .then(() => onkyo.pwrOn())
        .then(() => Promise.delay(500))
        .then(() => onkyo.volUp())
        .then(() => Promise.delay(500))
        .then(() => onkyo.volDown())

        .then(() => Promise.delay(500))
        .then(() => onkyo.mute())

        .then(() => Promise.delay(500))
        .then(() => onkyo.unMute())

        // .then(() => onkyo.setSource("VIDEO2"))
        .then(() => onkyo.pwrOff())

        .then(() => onkyo.close())
        .then(process.exit)
        .catch((error) => {
            console.log(error);
            process.exit();
        });
        */
    }
}

module.exports = ReceiverController;