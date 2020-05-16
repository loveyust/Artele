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

io.on("connection", socket => {
  console.log("New client connected" + socket.id);

  // Returning the initial data of airtable data
  socket.on("request_museum_data", () => {
    // collection_foodItems.find({}).then(docs => {
    // collection_artsource.find({}).then(docs => {
      //console.log("docs: " + docs);
      io.sockets.emit("send_museum_data", data.airTableData);
    // });
  });

  socket.on("request_settings_data", () => {
    io.sockets.emit("send_settings_data", data.settings);
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


/*fetch(url)
    .then(response => response.json())
    .then(response => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (response.status === 404) //|| (contentType != null && contentType.indexOf('javascript') === -1)
      {
        // No service worker found. Probably a different app. Reload the page.
    
        console.log('Error loading department API');
      } else {
        // Service worker found. Proceed as normal.
        // registerValidSW(swUrl, config);
        console.log('loadObjectsByDepartment: ' + JSON.stringify(response));
      }
    })
    .catch(() => {
      console.log(
        'No internet connection found. App is running in offline mode.'
      );
    });*/