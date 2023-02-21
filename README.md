# Artele 

## Intro

App to display art museum content from various art museum and other content and image APIs (The Met, Cooper Hewitt, NASA, etc...). 

Experience Architecture:
- React app: Runs the display interface that runs and a mobile interface for updating and saving content. They are connected with a socket server. 
- AirTable CMS: Stores a growing list of museum and image APIs that are dynamically loaded into the app and persistent settings like the amount of time each image is present and which APIs are active
- Raspberry Pi 4: Runs the app in full screen and is connected to home A/V reciever for display on the TV. The RPi has scripts to communicate with an Onkyo TX-NR797 receiver in order to self select itself as the source and turn on the TV and receiver on a pre-determined and automated schedule. 


## React App Folder Structure:
      

       
       
       services /* Socket server and data service on backend */ 
        data.service.js  /* AirTable and API access */
        socket.server.js /* Socket server and interface comms */    
       build/            /* Deployment of Frontend Build */        
       public/
       src/              /* Frontend Sourcecode */
        assets/          /* Fonts */
        components/      /* UI elements */
        containers/      /* UI compositions */      
        App.js           /* Routing logic */
       package.json      /* Frontend dependency */ 
       
    


## Frontend Code

Project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### `yarn install`
Installs dependancies and modules

### `npm run start`

Runs the app in the development mode and launches the socket server<br>
- Open [http://localhost:3000](http://localhost:3000) to view the mobile interface in the browser.
- Open [http://localhost:3000/display](http://localhost:3000/display) to view the TV display in the browser.


### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
<br> For deployment, put the build code into the backend-my-app/build folder <br> and then start the express server


## Deployment and Startup

* Copy build app tp RPi: <br>`scp -r */build pi@192.168.1.000:/home/pi/Desktop/`
* RPi startup script: 
<br>`sudo nano /etc/xdg/lxsession/LXDE-pi/autostart`
<br>`@bash <path>/utils/kiosk.sh`
* kiosk.sh:
  * Launch web servers 
       * Run web server: <br>`serve -s build -l 3000`
       * Run socket server: <br>`node build/services/socket.server.js`
  * start chrome <br>
       `chromium-browser --noerrdialogs --disable-infobars --incognito --startfullscreen http://localhost:3000/display`







