// socket server
const express = require("express");
const http = require("http");
// our localhost port
const port = process.env.PORT || 3001;
const app = express();

app.use(function (req, res, next) {
  //res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET"); // , POST, PUT ,DELETE");
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header('Access-Control-Allow-Credentials', true);
  res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// our server instance
// This creates our socket using the instance of the server
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type"],
    credentials: true
  }  
});

callback = () => {
  console.log("socket Send Image");
  io.sockets.emit("send_random_image", data.curImageObject);
}

// Data Service
const DataService = require('./data.service');
const data = new DataService();
data.setCallback(callback);

// Receiver Controller
const ReceiverController = require('./receiver.controller');
const rcontroller = new ReceiverController();


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
    rcontroller.setScheduleCron(scheduleObj.day, scheduleObj.data);
  });

  socket.on("request_set_paused", (paused) => {
    console.log('socket request_set_paused: ' + JSON.stringify(paused));
    data.setPaused(paused);
  });

  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.use(express.static("build"));

server.listen(port, () => console.log(`Listening on port ${port}`));