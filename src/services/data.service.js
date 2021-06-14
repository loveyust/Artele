const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var requestImage = new XMLHttpRequest();
const environment = require('../environment.js');
// Airtable
const Airtable = require("airtable");
// https://github.com/node-fetch/node-fetch/blob/master/docs/CHANGELOG.md#v300-beta7 
const fetch = require("node-fetch"); 
const base = new Airtable({ apiKey: environment.production.airtableKey }).base(environment.production.airtableBase);
const ColorThief = require('colorthief');

// Receiver Controller
const ReceiverController = require('./receiver.controller');
const rcontroller = new ReceiverController();

class DataService {
  // DataService Singleton
  constructor() {
    if (DataService.instance) {
      return DataService.instance;
    }
    DataService.instance = this;
     
    this.loadingData = false;
    this.callbacks = [];
    console.log('DataService constructor');
    this.loadData();
    return this;
  }

  registerDataLoadCallback(self, callback) {
    console.log('registerDataCallback: ' + this.callbacks.length);
    this.callbacks.push({self:self, callback:callback});
    if (this.dataLoaded) {
      this.makeRegisteredCallbacks();
    }
  }

  makeRegisteredCallbacks() {
    this.callbacks.forEach(registree => {
      console.log('dataService callbacks: ' + registree);
      registree.callback(registree.self);
    });
  }

  loadData () { // (self, callback) {
    if (!this.loadingData) {
      this.loadingData = true;

      this.objectIDs = [];
      this.airTableData = [];
      this.numMuseums = 0;
      this.curMuseumNum = 0;
      this.curDepartments = [];
      this.curDepartmentNum = 0;
      this.curObjectString = "";
      this.callback = null;
      this.imageCallback = null;
      this.callbackSelf = null;
      this.curImageObject = null;
      this.dataLoaded = false;
      
      this.test = true;
      this.timePerArtworkMS = 10000;
      this.matColor = '#333333';
      this.settings = {};

      console.log('dataSevice loadData()');
      this.numMuseums = 0;
      this.curMuseumNum = 0;
      // this.callback = callback;
      // this.callbackSelf = self;
      this.loadAirTableBase('ArtControl');
    }
  } 

  // Load Museum API data
  loadAirTableBase (baseName){
    var that = this;
    base(baseName).select({
      // Selecting the first 3 records in Grid view:
      maxRecords: 100,
      view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
      if (baseName === 'ArtControl') {
        var settings = records.map(r => { 
          console.log('Settings:' + JSON.stringify(r));
          return { 
            id: r.id,
            timePerArtwork: r.get('TimePerArtworkSecs'),
            matColor: r.get('MatColor'),
            weekday: {
              active: r.get('ActiveWeekday'),
              amOn: r.get('AMOnWeekday'),
              amOff: r.get('AMOffWeekday'),
              pmOn: r.get('PMOnWeekday'),
              pmOff: r.get('PMOffWeekday')
            },
            weekend: {
              active: r.get('ActiveWeekend'),
              amOn: r.get('AMOnWeekend'),
              amOff: r.get('AMOffWeekend'),
              pmOn: r.get('PMOnWeekend'),
              pmOff: r.get('PMOffWeekend')
            }
          }
        });
        if (settings.length > 0) {
          that.settings = settings[0];
        }
        that.loadAirTableBase('ArtSources');
      } else if (baseName === 'ArtSources') {
        // This function (`page`) will get called for each page of records.
        var newState = records.map(r => { 
          let rData = JSON.stringify(r).substr(0, 500) + "\u2026";
          console.log('Load ArtSources: ' + rData);
          return { 
            id: r.id,
            name: r.get('Name'), 
            active: r.get('Active'),
            accessToken: r.get('AccessToken'), 
            departmentIDs: r.get('DepartmentIDs'), // eyebrow,
            departmentObjectAPI: r.get('DepartmentObjectAPI'),
            departmentArray: r.get('DepartmentArray'),
            departmentObjectField: r.get('DepartmentObjectField'),
            objectAPI: r.get('ObjectAPI'),
            objectIDs: r.get('ObjectIDs'),
            imageField: r.get('ImageField'),
            titleField: r.get('TitleField'),
            artistField: r.get('ArtistField'),
            dateField: r.get('DateField'),
            mediumField: r.get('MediumField'),
            objectIDsArray: []
          }
        })
        that.airTableData = newState;
        that.numMuseums = that.airTableData.length;
        that.loadMuseum(that.curMuseumNum);
      }
    }, function done(err) {
        if (err) { console.error(err); return; }
    });
  }

  loadMuseum(curMuseumNum) {
    // TODO: If we already have ObjectIDs saved for this museum, 
    // lets avoid loading ObjectIDs unless there is some kind of update flag
    if (this.airTableData[curMuseumNum].departmentIDs !== undefined) {
      this.curDepartments = this.airTableData[curMuseumNum].departmentIDs.split(',');
    } else {
      this.curDepartments = [];
    }
    this.curDepartmentNum = 0;
    if (this.airTableData[curMuseumNum].objectIDs === undefined) {
      this.loadObjectsByDepartment(curMuseumNum, this.curDepartmentNum);
    } else {
      this.airTableData[curMuseumNum].objectIDsArray = this.airTableData[curMuseumNum].objectIDs.split(',');
      this.loadNextMuseum();
    }
  }

  loadNextMuseum() {
    this.curMuseumNum += 1;
    this.curObjectString = [];
    if (this.curMuseumNum < this.airTableData.length) {
      this.loadMuseum(this.curMuseumNum);
    } else {
      // All museum data is loaded 

      // set the cron schedule
      rcontroller.setScheduleCron(this.settings.weekday, this.settings.weekend);

      // this.callback(this.callbackSelf);
      this.dataLoaded = true;
      this.makeRegisteredCallbacks();
    }
  }

  loadObjectsByDepartment(curMuseumNum, curDepartmentNum) {
    // figure out the URL and add accesstoken and departmentID
    var url = this.airTableData[curMuseumNum].departmentObjectAPI.replace("DepartmentID", this.curDepartments[curDepartmentNum]);
    
    if (this.airTableData[curMuseumNum].accessToken !== undefined) {
      // Swap in the access token for this API if it is defined
      url = url.replace("AccessToken", this.airTableData[curMuseumNum].accessToken);
    }

    console.log(url + ' AT: ' + this.airTableData[curMuseumNum].accessToken);
    var that = this;
    fetch(url, {
      method: 'GET',
      headers: { ContentType: 'application/json'},
      referrer: 'no-referrer'
    }).then(function (response) {
      // The API call was successful!
      return response.json();
    }).then(function (data) {

      if (that.airTableData[that.curMuseumNum] != undefined) {
        // The object terms that get us to the Object ID. 
        var objectNameArray = that.airTableData[that.curMuseumNum].departmentArray.split(',');

        // console.log('data: ' + JSON.stringify(objectNameArray));
        // Save the ObjectIDs
        var objectArray = data;
        if (objectNameArray.length > 0) {
          objectNameArray.forEach(element => {
            objectArray = objectArray[element];
            console.log('data3: ' + JSON.stringify(objectArray));
          });
        }

        var objectFieldNameArray = [];
        var objectFieldArray = [];
        if (that.airTableData[that.curMuseumNum].departmentObjectField !== undefined) {
          objectFieldNameArray = that.airTableData[that.curMuseumNum].departmentObjectField.split(',');

          console.log('data2: ' + JSON.stringify(objectFieldNameArray + ' ' + objectArray.length));
          for (var i = 0; i < objectArray.length; i++) {
            objectFieldArray[i] = that.processElementArray(that, objectArray[i], objectFieldNameArray, '');
          }
        } else {
          objectFieldArray = objectArray;
        }

        // console.log('objectFieldArray: ' + objectFieldArray);
        // randomize the order of the object, so we get different results. 
        for(let i = objectFieldArray.length - 1; i > 0; i--){
          const j = Math.floor(Math.random() * i)
          const temp = objectFieldArray[i];
          objectFieldArray[i] = objectFieldArray[j];
          objectFieldArray[j] = temp;
        }

        console.log('objectFieldArray: ' + objectFieldArray);
        // Save some of the ObjectIDs for later
        var slicedArray = objectFieldArray.slice(0, 100);

        that.curObjectString = that.curObjectString.concat(slicedArray.join() + ',');
        console.log('that.curObjectString: ' + that.curObjectString);
        that.curDepartmentNum += 1;
        if (that.curDepartmentNum < that.curDepartments.length) {
          // Load the next department
          that.loadObjectsByDepartment(curMuseumNum, that.curDepartmentNum);
        } else {
          // Update AirTable with Objects
          that.uploadObjectsToAirTable(curMuseumNum, that.curObjectString);
          that.loadNextMuseum();
        }
      }
    }).catch(function (err) {
      // There was an error
      console.warn('Something went wrong. loadObjectsByDepartment', err);
    });
  }

  // Upload the object IDs back to AirTable to reduce API calls. 
  uploadObjectsToAirTable(curMuseumNum, dataStr) {
    var tempStr = '' + dataStr;
    this.airTableData[curMuseumNum].objectIDsArray = tempStr.split(',');
    base('ArtSources').update([
      {
        "id": this.airTableData[curMuseumNum].id,
        "fields": {
          "ObjectIDs": tempStr
        }
      }
    ], function(err, records) {
      if (err) {
        console.error(err);
        return;
      }
      records.forEach(function(record) {
        console.log(record.get('ObjectIDs'));
      });
    });
  }

  // Request for a random image and information to display
  getRandomImage(imageCallback) {

    this.imageCallback = imageCallback;

    // Select a random museum
    var curMuseumNum = Math.floor(Math.random() * this.airTableData.length);

    // Make sure we choose an active Museum
    while(!this.airTableData[curMuseumNum].active) {
      curMuseumNum = Math.floor(Math.random() * this.airTableData.length);
    }

    // Select a random object from that museum's collection (from pre-filled object )
    var randomObjectNum = 0;
    var tempObjectID = '';
    while(tempObjectID === '' || tempObjectID === undefined) {
      randomObjectNum = Math.floor(Math.random() * this.airTableData[curMuseumNum].objectIDsArray.length);
      tempObjectID = this.airTableData[curMuseumNum].objectIDsArray[randomObjectNum];
    }

    // Cooper Hewitt, Object with only video, no images '68268677'
    var url = this.airTableData[curMuseumNum].objectAPI.replace("ObjectID", this.airTableData[curMuseumNum].objectIDsArray[randomObjectNum]);
    if (this.airTableData[curMuseumNum].accessToken !== undefined) {
      // Swap in the access token for this API if it is defined
      url = url.replace("AccessToken", this.airTableData[curMuseumNum].accessToken);
    }

    //// url = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/56602';
    // url = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/23949';
    console.log('Object URL: ' + url);
    var that = this;
    // Begin accessing JSON data here
    fetch(url, {
      method: 'GET',
      headers: { ContentType: 'application/json'},
      referrer: 'no-referrer'
    }).then(function (response) {
      // The API call was successful!
      return response.json();
    }).then(function (data) {
      // This is the JSON from our response
      // console.log('FETCH: ' + JSON.stringify(data));
      // After object has been found, reconcile differences between museum APIs
      // Image
      var imagePathArray = that.airTableData[curMuseumNum].imageField.split(',');
      var image = that.processElementArray(that, data, imagePathArray, 'https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg');
      console.log('derived image: ' + image);

      // Title
      var titlePathArray = that.airTableData[curMuseumNum].titleField.split(',');
      var title = that.processElementArray(that, data, titlePathArray, '');

      // Artist
      var artistPathArray = that.airTableData[curMuseumNum].artistField.split(',');
      var artist = that.processElementArray(that, data, artistPathArray, ''); // data[that.airTableData[curMuseumNum].artistField];
      if (artist === '' || artist === undefined) {
        artist = 'Unknown';
      }

      // Date
      var datePathArray = that.airTableData[curMuseumNum].dateField.split(',');
      var date = that.processElementArray(that, data, datePathArray, ''); // var date = data[that.airTableData[curMuseumNum].dateField];

      // Medium
      var mediumPathArray = that.airTableData[curMuseumNum].mediumField.split(',');
      var medium = that.processElementArray(that, data, mediumPathArray, ''); // var medium = data[that.airTableData[curMuseumNum].mediumField];

      // Department Name
      // TODO

      var matColor = '#000000';
      var textColor = '#FFFFFF';

      that.curImageObject = {
        image: image,
        title: title,
        artist: artist,
        date: date,
        medium: medium,
        museumName: that.airTableData[curMuseumNum].name,
        objectID: tempObjectID,
        matColor: matColor,
        textColor: textColor
      };

      ColorThief.crossOrigin = 'Anonymous';
      ColorThief.getPalette(image, 2)
      .then(color => { 
        // const .join('');
        var hex = that.rgbToHex(color[1][0], color[1][1], color[1][2]); 
        //var hexInv = that.invert(color[1]);
        matColor = hex;
        var hexInv = that.getContrast(matColor);
        textColor = hexInv;
        console.log('ColorThief: ' + hex + ' ' + hexInv);

        that.curImageObject.matColor = matColor;
        that.curImageObject.textColor = textColor;

        // Send the image back to the Display through its callback function
        that.imageCallback();
      })
      .catch(err => { 
        console.log('ColorThiefError' + err);
        that.imageCallback();
      });

    }).catch(function (err) {
      // There was an error
      console.warn('Something went wrong.', err);
    });
  }

  // Color helper functions 
  componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  rgbToHex(r, g, b) {
      return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  }
  invert(rgb) {
    rgb = [].slice.call(arguments).join(",").replace(/rgb\(|\)|rgba\(|\)|\s/gi, '').split(',');
    for (var i = 0; i < rgb.length; i++) rgb[i] = (i === 3 ? 1 : 255) - rgb[i];
    return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
  }
  getContrast(hexcolor){

    // If a leading # is provided, remove it
    if (hexcolor.slice(0, 1) === '#') {
      hexcolor = hexcolor.slice(1);
    }
  
    // Convert to RGB value
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
  
    // Get YIQ ratio
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
    // Check contrast
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };

  processElementArray(that, data, elementArray, defaultElement) {
    var endpointReturn = defaultElement;
    var endpoint = data;
    elementArray.forEach(element => {
      endpoint = that.returnElement(endpoint, element);
      if (element === elementArray[elementArray.length - 1] && endpoint !== undefined) {
        endpointReturn = endpoint;
      }
    });
    return endpointReturn;
  }

  returnElement(dataObj, element) {
    if (element.substr(-2) === '[]') {
      // This is an array, send the first element for now
      // console.log('returnElement data element: '+ JSON.stringify(dataObj) + ' ' + element);
      if (dataObj === undefined || dataObj[element.slice(0, -2)] === undefined){
        return;
      } else {
        return dataObj[element.slice(0, -2)][0];
      }
    } else {
      if (dataObj === undefined){
        return;
      } else {
        return dataObj[element];
      }
    }
  }

  // Set a museum to be active 
  setActive(active, id) {
    console.log('setActive: ' + active + ' ' + id);
    for (var i = 0; i < this.airTableData.length; i++) {
      console.log('setActive: ' + this.airTableData[i].id);
      if (id === this.airTableData[i].id) {
        this.airTableData[i].active = active;
        // var tempStr = '' + active;
        base('ArtSources').update([
          {
            "id": id,
            "fields": {
              "Active": active
            }
          }
        ], function(err, records) {
          if (err) {
            console.error(err);
            return;
          }
        });
      }
    }
    console.log('setActive: ' + this.airTableData[0].active);
  }

  // Set the amount of time each artwork is visible
  setArtTime(timeSecs) {
    console.log('setTimeSecs: ' + timeSecs + ' ' + this.settings.timePerArtwork);
    this.settings.timePerArtwork = timeSecs;
    base('ArtControl').update([
      {
        "id": this.settings.id,
        "fields": {
          "TimePerArtworkSecs": parseInt(timeSecs)
        }
      }
    ], function(err, records) {
      if (err) {
        console.error(err);
        return;
      }
    });
  }

  // Change the schedule for weekday or weekend 
  setSchedule(day, data) {
    console.log('setSchedule: ' + day + ' ' + JSON.stringify(data));
    this.settings[day] = data;
    let capString = day.charAt(0).toUpperCase() + day.slice(1);
    
    base('ArtControl').update([
      {
        "id": this.settings.id,
        "fields": {
          ['Active' + capString]: data.active,
          ['AMOn' + capString]: parseInt(data.amOn),
          ['AMOff' + capString]: parseInt(data.amOff),
          ['PMOn' + capString]: parseInt(data.pmOn),
          ['PMOff' + capString]: parseInt(data.pmOff)
        }
      }
    ], function(err, records) {
      if (err) {
        console.error(err);
        return;
      }
    }).then(() => {
      // set the cron schedule
      rcontroller.setScheduleCron(this.settings.weekday, this.settings.weekend);
    });
  }

  clearImageData() {
    console.log('data clearImageData');
    var that = this;
    for (var i = 0; i < this.airTableData.length; i++) {
      this.airTableData[i].objectIDs = undefined;
      base('ArtSources').update([
        {
          "id": this.airTableData[i].id,
          "fields": {
            "ObjectIDs": ""
          }
        }
      ], function(err, records) {
        if (err) {
          console.error(err);
          return;
        }
      });
    }
    this.loadingData = false;
    that.loadData();
    // .then(() => {that.loadData();})
  }
}

module.exports = DataService;