// socket server
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

// our localhost port
const port = config.port;
const app = express();

app.use(function (req, res, next) {
  // res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET"); // , POST, PUT ,DELETE");
  res.header("Access-Control-Allow-Origin", config.corsOrigins[0] || "http://localhost:3000");
  res.header('Access-Control-Allow-Credentials', true);
  res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// our server instance
// This creates our socket using the instance of the server
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type"],
    credentials: true
  }
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'artele-socket',
    port
  });
});

app.get('/config', (req, res) => {
  res.json({
    ok: true,
    receiverEnabled: Boolean(config.receiver.enabled && config.receiver.ip),
    corsOrigins: config.corsOrigins
  });
});

function dataLoadedCallback () {
  console.log("dataLoaded Callback");
  schedulerController.setSchedule(data.settings);
  io.sockets.emit("send_images_updated");
}

function callback () {
  console.log("socket Send Image");
  io.sockets.emit("send_random_image", data.curImageObject);
}

// Data Service
import DataService from './data.service.js';
const data = new DataService();
data.setCallback(callback, dataLoadedCallback);

// Schedule Controller
import ScheduleController from './scheduler.controller.js';
//const SchedulerController = require('./src/SchedulerController');
// import ScheduleController from './schedule.controller.js';

const setAutoPlayFromScheduler = (auto) => {
  console.log('setAutoPlayFromScheduler: ' + auto);
  // If false show static image http://localhost:3000/window/
  /* state.isAutoplay = auto;
  io.emit('switch.state', state);
  checkTimer();
  if (!auto) {
    io.emit('switch.scene', '/window/content/idle');
  } */
}
const schedulerController = new ScheduleController((auto) => {setAutoPlayFromScheduler(auto)});

io.on("connection", socket => {
  console.log("New client connected" + socket.id);

  // Returning the initial data of airtable data
  socket.on("request_museum_data", (datas) => {
    console.log('socket request_museum_data ' + datas);
    io.sockets.emit("send_museum_data", data.airTableData);
  });

  socket.on("request_settings_data", (datas) => {
    console.log('socket request_settings_data ' + datas);
    io.sockets.emit("send_settings_data", data.settings);
  });

  socket.on("request_random_image", (datas) => {    
    console.log('socket request_random_image ' + datas);
    // rcontroller.test();
    if (!data.dataLoaded || !data.airTableData || data.airTableData.length === 0) {
      console.log('request_random_image ignored: data not loaded yet');
      io.sockets.emit("send_random_image_error", { message: "Data not loaded yet" });
      return;
    }
    data.getRandomImage(false);
  });

  socket.on("set_time", time => {
    // time should contain new time value - could also do settings in general
    io.sockets.emit("send_time");
  });

  // Requests from Artele interface 
  socket.on("request_set_time", (timeSecs) => {
    console.log('socket request_set_time: ' + timeSecs);
    data.setArtTime(timeSecs);
    io.sockets.emit("send_set_time", timeSecs);
  });

  socket.on("request_images_update", () => {
    console.log('socket request_images_update: ');
    data.clearImageData();
    // io.sockets.emit("send_set_time", timeSecs);
  });

  socket.on("request_set_active", (activeObj) => {
    console.log('socket request_set_active: ' + JSON.stringify(activeObj));
    data.setActive(activeObj.active, activeObj.id);
  });

  socket.on("request_set_schedule", (scheduleObj) => {
    console.log('socket request_set_schedule: ' + JSON.stringify(scheduleObj));
    data.setSchedule(scheduleObj.day, scheduleObj.data);
    schedulerController.setSchedule(data.settings);
  });

  socket.on("request_set_paused", (paused) => {
    console.log('socket request_set_paused: ' + JSON.stringify(paused));
    data.setPaused(paused);
  });

  socket.on("request_prev_image", () => {
    console.log('socket request_prev_image');
    data.getPrevImage();
  });

  socket.on("request_next_image", () => {
    console.log('socket request_next_image');
    data.getNextImage();
  });

  socket.on("request_save_image", () => {
    console.log('socket request_save_image: ' + JSON.stringify(data.curImageObject));
    data.saveImage();
  });

  socket.on("request_save_source", (sourceData) => {
    console.log('socket request_save_source: ' + JSON.stringify(sourceData));
    data.saveSource(sourceData);
    io.sockets.emit("send_museum_data", data.airTableData);
  });

  socket.on("request_delete_source", (id) => {
    console.log('socket request_delete_source: ' + id);
    data.deleteSource(id);
    io.sockets.emit("send_museum_data", data.airTableData);
  });

  socket.on("request_test_source", async ({ objectAPI, sampleId, accessToken }) => {
    console.log('socket request_test_source: ' + objectAPI + ' id:' + sampleId);
    const result = await data.testSource(objectAPI, sampleId, accessToken);
    socket.emit("send_test_result", result);
  });

  socket.on("request_clear_source_ids", (id) => {
    console.log('socket request_clear_source_ids: ' + id);
    data.clearSourceIds(id);
    io.sockets.emit("send_museum_data", data.airTableData);
  });

  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientBuildPath = path.resolve(__dirname, '..', '..', 'build');
app.use(express.static(clientBuildPath));
httpServer.listen(port, config.host, () => console.log(`Listening on ${config.host}:${port}`));
