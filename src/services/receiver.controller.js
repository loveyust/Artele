// import fs from 'fs'; // const fs = require('fs');

// Onkyo.js
import Promise from 'bluebird'; // const Promise = require('bluebird');
import {OnkyoDiscover, Onkyo} from 'onkyo.js'; // const {OnkyoDiscover, Onkyo} = require('onkyo.js');
const onkyo = new Onkyo({ip: '192.168.1.104'});
// Command reference
// https://github.com/jupe/onkyo.js/blob/master/sample/control.js

// cec-controller for the TV
import CecController from 'cec-controller'; // var CecController = require('cec-controller');

// Scheduling
import cron from 'node-cron'; // const cron = require('node-cron');

process.on('unhandledRejection', function(err) {
    console.log('GLOBAL ERROR CATCH: ' + err);
    // sendInTheCalvary(err);
});

export default class ReceiverController {
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
    // Weekday
    this.weekdayAmOn = cron.schedule('* * * * * *', () => {});
    this.weekdayAmOff = cron.schedule('* * * * * *', () => {});
    this.weekdayPmOn = cron.schedule('* * * * * *', () => {});
    this.weekdayPmOff = cron.schedule('* * * * * *', () => {});

    // Weekend
    this.weekendAmOn = cron.schedule('* * * * * *', () => {});
    this.weekendAmOff = cron.schedule('* * * * * *', () => {});
    this.weekendPmOn = cron.schedule('* * * * * *', () => {});
    this.weekendPmOff = cron.schedule('* * * * * *', () => {});

    // Weekday
    this.weekdayAmOn.stop();
    this.weekdayAmOff.stop();
    this.weekdayPmOn.stop();
    this.weekdayPmOff.stop();

    // Weekend
    this.weekendAmOn.stop();
    this.weekendAmOff.stop();
    this.weekendPmOn.stop();
    this.weekendPmOff.stop();
  }

  setScheduleCron(weekday, weekend) {
    console.log('ReceiverController setScheduleCron: ' + weekday.amOn);

    //if ()
    // Weekday
    this.weekdayAmOn = cron.schedule('0 0 ' + weekday.amOn + ' * * 1-5', () => { this.turnOnReceiver(); });
    this.weekdayAmOff = cron.schedule('0 0 ' + weekday.amOff + ' * * 1-5', () => { this.turnOffReceiver(); });
    this.weekdayPmOn = cron.schedule('0 0 ' + weekday.pmOn + ' * * 1-5', () => { this.turnOnReceiver(); });
    this.weekdayPmOff = cron.schedule('0 0 ' + weekday.pmOff + ' * * 1-5', () => { this.turnOffReceiver(); });

    // Weekend - test for every 10 secs: */10 * * * * 6-7
    // this.weekendAmOn = cron.schedule('*/10 * * * * 6-7', () => { this.turnOnReceiver(); });
    this.weekendAmOn = cron.schedule('0 0 ' + weekend.amOn + ' * * 6-7', () => { this.turnOnReceiver(); });
    this.weekendAmOff = cron.schedule('0 0 ' + weekend.amOff + ' * * 6-7', () => { this.turnOffReceiver(); });
    this.weekendPmOn = cron.schedule('0 0 ' + weekend.pmOn + ' * * 6-7', () => { this.turnOnReceiver(); });
    this.weekendPmOff = cron.schedule('0 0 ' + weekend.pmOff + ' * * 6-7', () => { this.turnOffReceiver(); });
  }

  turnOnReceiver() {
    console.log('ReceiverController - turnOn');
    // Turn on the receiver
    // restart the timer to send a new image to the display, image timer should only run when the system is on

  }

  turnOffReceiver() {
    console.log('ReceiverController - turnOff');
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