// import fs from 'fs'; // const fs = require('fs');

// Onkyo.js
import Promise from 'bluebird'; // const Promise = require('bluebird');
import {OnkyoDiscover, Onkyo} from 'onkyo.js'; // const {OnkyoDiscover, Onkyo} = require('onkyo.js');
const onkyo = new Onkyo({ip: '192.168.50.97'});
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
    
    // Initialize Onkyo connection with error handling
    this.initializeOnkyoConnection();
    
    // this.connect(); // CEC TV connection
    // this.initializeSchedule();
    return this;
  }

  initializeOnkyoConnection() {
    // Set up error handling for Onkyo connection
    onkyo.on('error', (errMsg) => {
      // Filter out non-critical unknown command errors
      if (errMsg.includes('Unknown data:')) {
        console.log('Onkyo unknown command (non-critical):', errMsg);
      } else {
        console.log('Onkyo connection error:', errMsg);
      }
    });

    onkyo.on('connected', () => {
      console.log('Onkyo receiver connected successfully');
    });

    onkyo.on('disconnected', () => {
      console.log('Onkyo receiver disconnected');
    });
  }

  initializeSchedule() {

    /* 
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
    this.weekendPmOff.stop(); */
  }

  /* 
  setScheduleCron(weekday, weekend) {
    console.log('ReceiverController setScheduleCron: ' + weekday.amOn);

    //if ()
    // Weekday
    this.weekdayAmOn = cron.schedule('0 0 ' + weekday.amOn + ' * * 1-5', () => { this.turnOnReceiver(); });
    this.weekdayAmOff = cron.schedule('0 0 ' + weekday.amOff + ' * * 1-5', () => { this.turnOffReceiver(); });
    this.weekdayPmOn = cron.schedule('0 0 ' + weekday.pmOn + ' * * 1-5', () => { this.turnOnReceiver(); });
    this.weekdayPmOff = cron.schedule('0 0 ' + weekday.pmOff + ' * * 1-5', () => { this.turnOffReceiver(); });

    // Weekend - test for every 10 secs:  10 * * * * 6-7
    // this.weekendAmOn = cron.schedule('10 * * * * 6-7', () => { this.turnOnReceiver(); });
    this.weekendAmOn = cron.schedule('0 0 ' + weekend.amOn + ' * * 6-7', () => { this.turnOnReceiver(); });
    this.weekendAmOff = cron.schedule('0 0 ' + weekend.amOff + ' * * 6-7', () => { this.turnOffReceiver(); });
    this.weekendPmOn = cron.schedule('0 0 ' + weekend.pmOn + ' * * 6-7', () => { this.turnOnReceiver(); });
    this.weekendPmOff = cron.schedule('0 0 ' + weekend.pmOff + ' * * 6-7', () => { this.turnOffReceiver(); });
  }
 */
  turnOnReceiver() {
    console.log('ReceiverController - turnOn');
    // Turn on the receiver
    return onkyo.pwrOn()
      .then(() => {
        console.log('Onkyo receiver turned ON successfully');
        // Optional: Set a specific input source after turning on
        // return onkyo.setSource('GAME'); // or 'STREAM', 'TV', etc.
      })
      .catch((error) => {
        console.error('Error turning ON Onkyo receiver:', error);
        throw error;
      });
  }

  turnOffReceiver() {
    console.log('ReceiverController - turnOff');
    // Turn off the receiver
    return onkyo.pwrOff()
      .then(() => {
        console.log('Onkyo receiver turned OFF successfully');
      })
      .catch((error) => {
        console.error('Error turning OFF Onkyo receiver:', error);
        throw error;
      });
  }

  // Check if receiver is on
  isReceiverOn() {
    return onkyo.isOn()
      .then((isOn) => {
        console.log(`Receiver is ${isOn ? 'ON' : 'OFF'}`);
        return isOn;
      })
      .catch((error) => {
        console.error('Error checking receiver status:', error);
        throw error;
      });
  }

  // Get current input source
  getCurrentSource() {
    return onkyo.getSource()
      .then((source) => {
        console.log(`Current source: ${source}`);
        return source;
      })
      .catch((error) => {
        console.error('Error getting current source:', error);
        throw error;
      });
  }

  // Set input source (e.g., 'GAME', 'STREAM', 'TV', 'BD/DVD', etc.)
  setInputSource(source) {
    console.log(`Setting input source to: ${source}`);
    return onkyo.setSource(source)
      .then(() => {
        console.log(`Input source set to ${source} successfully`);
      })
      .catch((error) => {
        console.error(`Error setting input source to ${source}:`, error);
        throw error;
      });
  }

  // Volume control methods
  volumeUp() {
    return onkyo.volUp()
      .then(() => console.log('Volume increased'))
      .catch((error) => console.error('Error increasing volume:', error));
  }

  volumeDown() {
    return onkyo.volDown()
      .then(() => console.log('Volume decreased'))
      .catch((error) => console.error('Error decreasing volume:', error));
  }

  mute() {
    return onkyo.mute()
      .then(() => console.log('Receiver muted'))
      .catch((error) => console.error('Error muting receiver:', error));
  }

  unmute() {
    return onkyo.unMute()
      .then(() => console.log('Receiver unmuted'))
      .catch((error) => console.error('Error unmuting receiver:', error));
  }

  // Get complete device state
  getReceiverState() {
    return onkyo.getDeviceState()
      .then((state) => {
        console.log('Receiver state:', state);
        return state;
      })
      .catch((error) => {
        console.error('Error getting receiver state:', error);
        throw error;
      });
  }

  connect () {
    console.log('Connecting to TV via CEC...');
    return this.initializeTVConnection()
      .then(() => {
        console.log('TV connection established');
      })
      .catch((error) => {
        console.error('Failed to connect to TV:', error);
        // Fallback to receiver control if TV connection fails
        this.changeReceiverInput();
      });
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

  // Example method showing how to use the receiver controller
  async testReceiverControl() {
    try {
      console.log('Testing receiver control...');
      
      // Check current state
      const state = await this.getReceiverState();
      
      // Check if receiver is on
      const isOn = await this.isReceiverOn();
      
      if (!isOn) {
        // Turn on receiver
        await this.turnOnReceiver();
        
        // Wait a moment for receiver to fully power on
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Set input source to GAME (or whatever you prefer)
        await this.setInputSource('GAME');
      } else {
        console.log('Receiver is already on');
        
        // Get current source
        await this.getCurrentSource();
      }
      
      console.log('Receiver control test completed successfully');
    } catch (error) {
      console.error('Receiver control test failed:', error);
    }
  }

  // TV Control Methods using CEC
  initializeTVConnection() {
    return new Promise((resolve, reject) => {
      if (this.cecCtl) {
        resolve(this.cecCtl);
        return;
      }

      this.cecCtl = new CecController();
      
      this.cecCtl.on('ready', (controller) => {
        console.log('CEC TV controller ready');
        this.tvController = controller;
        resolve(controller);
      });

      this.cecCtl.on('error', (err) => {
        console.error('CEC TV controller error:', err);
        reject(err);
      });
    });
  }

  async turnOnTV() {
    try {
      console.log('Turning ON TV...');
      
      if (!this.cecCtl) {
        await this.initializeTVConnection();
      }

      // Wait for controller to be ready
      if (!this.tvController) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (this.tvController && this.tvController.dev0) {
        if (this.tvController.dev0.powerStatus === 'standby') {
          await this.tvController.dev0.turnOn();
          console.log('TV turned ON successfully');
          return true;
        } else {
          console.log('TV is already ON');
          return true;
        }
      } else {
        throw new Error('TV controller not available');
      }
    } catch (error) {
      console.error('Error turning ON TV:', error);
      throw error;
    }
  }

  async turnOffTV() {
    try {
      console.log('Turning OFF TV...');
      
      if (!this.cecCtl) {
        await this.initializeTVConnection();
      }

      // Wait for controller to be ready
      if (!this.tvController) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (this.tvController && this.tvController.dev0) {
        await this.tvController.dev0.turnOff();
        console.log('TV turned OFF successfully');
        return true;
      } else {
        throw new Error('TV controller not available');
      }
    } catch (error) {
      console.error('Error turning OFF TV:', error);
      throw error;
    }
  }

  async getTVStatus() {
    try {
      if (!this.cecCtl) {
        await this.initializeTVConnection();
      }

      // Wait for controller to be ready
      if (!this.tvController) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (this.tvController && this.tvController.dev0) {
        const status = this.tvController.dev0.powerStatus;
        console.log(`TV Status: ${status}`);
        return status; // 'on' or 'standby'
      } else {
        throw new Error('TV controller not available');
      }
    } catch (error) {
      console.error('Error getting TV status:', error);
      throw error;
    }
  }

  // Combined method to turn on both TV and Receiver
  async turnOnSystem() {
    try {
      console.log('Turning ON complete system (TV + Receiver)...');
      
      // Turn on TV first
      await this.turnOnTV();
      
      // Wait a moment for TV to fully power on
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Turn on receiver
      await this.turnOnReceiver();
      
      // Wait for receiver to power on
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set receiver input source
      await this.setInputSource('GAME'); // or whatever input you prefer
      
      console.log('Complete system turned ON successfully');
    } catch (error) {
      console.error('Error turning ON system:', error);
      throw error;
    }
  }

  // Combined method to turn off both TV and Receiver
  async turnOffSystem() {
    try {
      console.log('Turning OFF complete system (TV + Receiver)...');
      
      // Turn off receiver first
      await this.turnOffReceiver();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Turn off TV
      await this.turnOffTV();
      
      console.log('Complete system turned OFF successfully');
    } catch (error) {
      console.error('Error turning OFF system:', error);
      throw error;
    }
  }

  // TV Control Methods using Onkyo Receiver CEC (via IP)
  async turnOnTVViaReceiver() {
    try {
      console.log('Turning ON TV via Onkyo receiver CEC...');
      
      // First turn on the receiver (this often triggers CEC to turn on TV)
      await this.turnOnReceiver();
      
      // Wait for receiver to fully power on
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to send CEC power on command through receiver
      // Many Onkyo receivers support this via raw commands
      try {
        await this.sendOnkyoCommand('CEC', 'PWR01'); // CEC Power On command
        console.log('CEC TV power on command sent via receiver');
      } catch (cecError) {
        console.log('Direct CEC command not available, using receiver power-on behavior');
        // Many receivers automatically turn on connected TV when they power on
      }
      
      return true;
    } catch (error) {
      console.error('Error turning ON TV via receiver:', error);
      throw error;
    }
  }

  async turnOffTVViaReceiver() {
    try {
      console.log('Turning OFF TV via Onkyo receiver CEC...');
      
      // Try to send CEC power off command through receiver
      try {
        await this.sendOnkyoCommand('CEC', 'PWR00'); // CEC Power Off command
        console.log('CEC TV power off command sent via receiver');
      } catch (cecError) {
        console.log('Direct CEC command not available');
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Turn off receiver (this often triggers CEC to turn off TV)
      await this.turnOffReceiver();
      
      return true;
    } catch (error) {
      console.error('Error turning OFF TV via receiver:', error);
      throw error;
    }
  }

  // Generic method to send raw commands to Onkyo receiver
  async sendOnkyoCommand(category, command) {
    return new Promise((resolve, reject) => {
      // This is a generic command sender - may need adjustment based on onkyo.js capabilities
      try {
        // Try to send raw command if supported
        if (onkyo.sendCommand) {
          onkyo.sendCommand(category, command)
            .then(resolve)
            .catch(reject);
        } else {
          // Fallback - command not supported
          reject(new Error('Raw command sending not supported'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // Improved system control using receiver CEC
  async turnOnSystemViaReceiver() {
    try {
      console.log('Turning ON complete system via receiver CEC...');
      
      // Turn on receiver first (this should trigger TV via CEC)
      await this.turnOnReceiver();
      
      // Wait for both receiver and TV to power on
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Set receiver input source
      await this.setInputSource('GAME'); // or whatever input you prefer
      
      console.log('Complete system turned ON via receiver CEC');
      return true;
    } catch (error) {
      console.error('Error turning ON system via receiver:', error);
      throw error;
    }
  }

  async turnOffSystemViaReceiver() {
    try {
      console.log('Turning OFF complete system via receiver CEC...');
      
      // Turn off receiver (this should trigger TV off via CEC)
      await this.turnOffReceiver();
      
      console.log('Complete system turned OFF via receiver CEC');
      return true;
    } catch (error) {
      console.error('Error turning OFF system via receiver:', error);
      throw error;
    }
  }
}