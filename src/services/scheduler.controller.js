import os from 'os';
// const { exec } = require('child_process');
import schedule from 'node-schedule';
const platform = os.platform();
// const socketClient = require('./services/socket-client');
// socketClient = new SocketClient({ type: 'scheduler' });

// Receiver Controller
import ReceiverController from './receiver.controller.js';
// Create receiver controller instance
const receiverController = new ReceiverController();
receiverController.testReceiverControl();
// Turn on receiver
// await receiverController.turnOnReceiver();
// Set input to GAME
// await receiverController.setInputSource('GAME');
// Check status
// const isOn = await receiverController.isReceiverOn();
// Turn off receiver
// await receiverController.turnOffReceiver();

export default class ScheduleController {
  constructor(autoplayCallback) {
    this.cmsSettings = null;
    this.autoplayCallback = autoplayCallback;
    console.log("SchedulerController - constructor");
  }

  clearSchedules () {
    for (let jobName in schedule.scheduledJobs) {
      schedule.scheduledJobs[jobName].cancel();
    };
  }

  transformSettings(newSettings) {
    return [
      {
        "name": "wakeUp",
        "weekday": `${newSettings.weekday.amOn}:0`,
        "weekend": `${newSettings.weekend.amOn}:0`
      },
      {
        "name": "workStart",
        "weekday": `${newSettings.weekday.amOff}:0`,
        "weekend": `${newSettings.weekend.amOff}:0`, // "NaN:NaN"
      },
      {
        "name": "workEnd",
        "weekday": `${newSettings.weekday.pmOn}:0`,
        "weekend": `${newSettings.weekend.pmOn}:0`
      },
      {
        "name": "sleepMode",
        "weekday": `${newSettings.weekday.pmOff}:0`,
        "weekend": `${newSettings.weekend.pmOff}:0`
      }
      /* {
        "name": "artMode",
        "weekday": `${newSettings.weekday.pmOn}:0`,
        "weekend": `${newSettings.weekend.pmOn}:0`
      } */
    ];
  }

  findCurrentMode (now, cmsSettings) {
    // Function to parse time string into hours and minutes
    const parseTime = (timeStr) => {
      if (timeStr === "NaN:NaN") {
        return null;
      }
      const [hours, minutes] = timeStr.split(':').map(Number);
      return { hours, minutes };
    };

    // Get current time and day of the week
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = { hours: currentHours, minutes: currentMinutes };

    // Find the schedule element that reflects the current mode
    let currentMode = null;

    for (const schedule of cmsSettings) {
      if (schedule.name !== "MainSwitch") {
        const scheduleTime = currentDay >= 1 && currentDay <= 5 ? parseTime(schedule.weekday) : parseTime(schedule.weekend);
        if (!scheduleTime) {
          continue;
        }
        if (currentTime.hours > scheduleTime.hours || (currentTime.hours === scheduleTime.hours && currentTime.minutes >= scheduleTime.minutes)) {
          if (currentMode === null || currentMode.hours < scheduleTime.hours) {
            scheduleTime.name = schedule.name;
            currentMode = scheduleTime;
          }
        }
      }
    }

    // Now that we know what was already scheduled we can go to that mode
    this[currentMode.name]();
  }

  setSchedule (cmsSettings) {
    this.cmsSettings = this.transformSettings(cmsSettings);
    /* cmsSettings: [
      {"name":"wakeUp","weekday":"7:0","weekend":"8:0"},
      {"name":"sleepMode","weekday":"0:0","weekend":"0:0"},
      {"name":"workEnd","weekday":"16:0","weekend":"NaN:NaN"},
      {"name":"MainSwitch","onDate":"2024-02-03","offDate":"2024-02-01"},
      {"name":"artMode","weekday":"19:0","weekend":"19:0"},
      {"name":"workStart","weekday":"9:30","weekend":"NaN:NaN"}
    ] */

    console.log("SchedulerController - setSchedule - cmsSettings: " + JSON.stringify(this.cmsSettings));

    // Clear previous schedules
    this.clearSchedules();
    const now = new Date();

    // Determine if Main Switch dates are active and do nothing if so (vacation)
    let onVacation = false;
    /* const mainSwitch = cmsSettings.find((setting) => setting.name === 'MainSwitch');
    if (mainSwitch) {
      const onDate = new Date(mainSwitch.onDate);
      const offDate = new Date(mainSwitch.offDate);
      if (now.getTime() >= onDate.getTime() && now.getTime() < offDate.getTime()) {
        onVacation = true;
      }
    } */

    if (!onVacation) {
      // If mainswitch is not blocked then set up schedules
      this.cmsSettings.forEach((setting) => {
        if (setting.name !== "MainSwitch") {
          // Set up schedule for the weekday
          if (setting.weekday !== "NaN:NaN") {
            const weekdaySetting = setting.weekday.split(":");
            schedule.scheduleJob(setting.name + 'weekday', weekdaySetting[1] + ' ' + weekdaySetting[0] + ' * * 1-5', () => {
              const functionName = setting.name;
              this[functionName]();
            });
          }
          // Set up schedule for the weekend
          if (setting.weekend !== "NaN:NaN") {
            const weekendSetting = setting.weekend.split(":");
            schedule.scheduleJob(setting.name + 'weekend', weekendSetting[1] + ' ' + weekendSetting[0] + ' * * 0,6', () => {
              const functionName = setting.name;
              this[functionName]();
            });
          }
        }
      });

      // If we are not vacation, determine the current mode based on the schedule and the current time and call the current mode. 
      this.findCurrentMode(now, this.cmsSettings);
    } 
  }

  wakeUp () {
    console.log("wakeUp: Screen on and start the feed");
    // Wake screen
    this.screenWake();
    // Turn on Autoplay on the socket server 
    this.autoplayCallback(false);
    
    // Turn on feed
    // this.startStream();
  };
  
  sleepMode () {
    console.log("sleepMode: put the app and PC to sleep");
    // Turn off feed
    // this.endStream();
    // Turn off Autoplay (turn on static image)
    this.autoplayCallback(false);
    // Turn off screen
    this.screenSleep();
  };
  
  workStart () {
    console.log("workStart: Start of work day go to sleep");
    // Turn off feed
    // this.endStream();
    // Turn off Autoplay (turn on static image)
    this.autoplayCallback(false);
    // Turn off screen
    this.screenSleep();
  };
  
  workEnd () {
    console.log("workEnd: End of work day - Wake up and back to feed");
    // Wakeup
    this.wakeUp();
  };
  
  /* artMode () {
    console.log("artMode: End feed and start art mode for the evening");
    // Turn on screen
    this.screenWake();
    // Turn off feed
    this.endStream();
    // Turn on Autoplay
    this.autoplayCallback(true);
  }; */

  // Receiver Controller On 
  screenWake () {


    /* if (platform === "win32") { // Windows
      const batchFilePath = 'C:\\WindowProject\\Code\\window-project\\utils\\windowsOn.bat';
      exec(batchFilePath, (error, stdout, stderr) => {
          if (error) { console.error(`exec error: ${error}`); return; }
          if (stderr) { console.log(`stderr: ${stderr}`); return; }
          console.log(`stdout: ${stdout}`);
      }); 
    }*/
  }

  // Receiver Controller Off
  screenSleep () {
    /* if (platform === "win32") { // Windows
      const batchFilePath = 'C:\\WindowProject\\Code\\window-project\\utils\\windowsOff.bat';
      exec(`cmd.exe /c "${batchFilePath}"`, (error, stdout, stderr) => {
          if (error) { console.error(`exec error: ${error}`); return; }
          if (stderr) { console.log(`stderr: ${stderr}`); return; }
          console.log(`stdout: ${stdout}`);
      }); 
    }*/
  }
  
  startStream () {
    // ./zsh - https://phoenixnap.com/kb/set-environment-variable-mac
    // RTSP Test - https://github.com/bluenviron/mediamtx
    // Initialize the simple RTSP server
    // /Users/charles.yust/Desktop/Projects/_immersive-window-project/Code/RTSPTest
    // ./mediamtx
    // Go to the video content folder to stream a video file on loop
    // ffmpeg -re -stream_loop -1 -i IMG_4995.MOV -c copy -f rtsp rtsp://localhost:8554/mystream

    // Test stream on Mac OSX
    let RTSP_URL = "rtsp://localhost:8554/mystream"; 
    if (platform === "win32") { // Windows
      RTSP_URL = process.env.RTSP_CAMERA_URL;
    }

    let command;
    if (platform === "darwin") { // macOS
      let ARGS = "--fullscreen --video-filter=rotate{angle=-90}";
      command = `/Applications/VLC.app/Contents/MacOS/VLC "${RTSP_URL}" ${ARGS}`; // -I dummy
      /* exec(command, (error, stdout, stderr) => {
        if (error) { console.error(`Execution error: ${error}`); return; }
        console.log(stdout);
        console.error(stderr);
      }); */
    } else if (platform === "win32") { // Windows
        command = `cscript //NoLogo utils/openVLC.vbs "${RTSP_URL}"`;
        /* exec(command, (error, stdout, stderr) => {
          if (error) { console.error(`Execution error: ${error}`); return; }
          console.log(stdout);
        }); */
    } else {
        // Handle other platforms or throw an error
        console.error("Unsupported platform");
        process.exit(1);
    }
  }

  endStream () {
    let shutdownCommand;
    if (platform === "darwin") { // macOS
        shutdownCommand = "killall VLC";
    } else if (platform === "win32") { // Windows
        shutdownCommand = "taskkill /IM vlc.exe /F";
    } else {
        // Handle other platforms or throw an error
        console.error("Unsupported platform for shutdown command");
        process.exit(1);
    }

    /* exec(shutdownCommand, (error, stdout, stderr) => {
      if (error) { console.error(`Execution error: ${error}`); return; }
      console.log(stdout);
      console.error(stderr);
    }); */
  }
};

// module.exports = SchedulerController;