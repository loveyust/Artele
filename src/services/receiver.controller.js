const fs = require('fs');

// Onkyo.js
const Promise = require('bluebird');
const {OnkyoDiscover, Onkyo} = require('onkyo.js');
const onkyo = new Onkyo({ip: '192.168.1.104'});
// Command reference
// https://github.com/jupe/onkyo.js/blob/master/sample/control.js

// cec-controller for the TV
var CecController = require('cec-controller');

// Scheduling
const cron = require('node-cron');

process.on('unhandledRejection', function(err) {
    console.log('GLOBAL ERROR CATCH: ' + err);
    // sendInTheCalvary(err);
});

class ReceiverController {
  // Receiver Controller Singleton
  constructor() {
    if (ReceiverController.instance) {
      return ReceiverController.instance;
    }
    ReceiverController.instance = this;
  
    console.log('ReceiverController constructor');
    // this.connect();
    this.initializeSchedule();
    return this;
  }

  initializeSchedule() {
    this.weekdayCron = cron.schedule('*/5 * * * * *', () => {
        console.log('running a task every 5 sec.');
    });
    this.weekdayCron.start();
    this.weekdayCron.stop();
    this.weekdayCron = cron.schedule('*/10 * * * * *', () => {
        console.log('running a task every 10 sec.');
    });
    this.weekdayCron.start();
  }

  connect () {
    this.cecCtl = new CecController();
    // Connect to the TV
    this.cecCtl.on('ready', this.readyHandler.bind(this));
    this.cecCtl.on('error', this.cecError.bind(this));
  }

  cecError(err) {
    console.error(err);
    this.changeReceiverInput();
  }

  readyHandler(controller)
  {
    let that = this;
    console.log(controller)
    console.log('Checking TV Status...' + controller.dev0.powerStatus);
    // If TV is off('standby'), turn it on, then change the input. 
    // TODO: Add the scheduling to make sure it is time to turn this on. 
    if(controller.dev0.powerStatus === 'standby') {
      console.log('Turning ON TV...');
      controller.dev0.turnOn().then(() =>
      {
          // controller.setActive();
          console.log('TV on...');
          this.changeReceiverInput();
      });
    } else {
      // TV already on, change receiver input.
      console.log('TV already on...'); 
      this.changeReceiverInput();
    }
  }

  changeReceiverInput() 
  {
    // Test comm with onkyo
    // STREAM, GAME - target input modes
    console.log('Test Onkyo in');

    // Catch errors in onkyo communication, especially after setSource()
    onkyo.on('error', (errMsg) => {
        // this generates file 'unknown_msgs.txt' if unrecognized messages
        // is received from amplifier. Please raise issues with body if file appears.
        // fs.appendFile('unknown_msgs.txt', `${errMsg}\n`, (err) => {
        //   if (err) console.error(err);
        // });
        console.log('onkyo error: ' + errMsg);
      });
    // onkyo.on('connected', () => console.log('onkyo connected'));
    onkyo.getDeviceState()
    .then((state) => { console.log(state);})
    .then(() => Promise.delay(500))
    .catch((error) => {
        console.log('ONKYO ERROR ' + error);
        process.exit();
    });
    
    // Set Source on the receiver. 
/*      .then(() => onkyo.setSource('GAME').then((onkyo) => {
        console.log(`Set Source: ${onkyo.toString()}`);
    }).catch((error) => {
        console.log('SET SOURCE ERROR ' + error);
    }))
*/        
    console.log('Test Onkyo in over');

      
/*
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
*/
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