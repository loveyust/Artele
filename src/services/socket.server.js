// socket server
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
// our localhost port
const port = process.env.PORT || 3001;
const app = express();
// our server instance
const server = http.createServer(app);
// This creates our socket using the instance of the server
const io = socketIO(server);

// Data Service
const DataService = require('./data.service');
const data = new DataService();

function callback() {
  console.log("socket Send Image");
  io.sockets.emit("send_random_image", data.curImageObject);
}

io.on("connection", socket => {
  console.log("New client connected" + socket.id);

  // Returning the initial data of airtable data
  socket.on("request_museum_data", () => {
    io.sockets.emit("send_museum_data", data.airTableData);
  });

  socket.on("request_settings_data", () => {
    io.sockets.emit("send_settings_data", data.settings);
  });

  socket.on("request_random_image", () => {
    console.log("socket Request Image");
    data.getRandomImage(callback);
  });

  socket.on("set_time", time => {
    // time should contain new time value - could also do settings in general
    io.sockets.emit("send_time");
  });


  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));