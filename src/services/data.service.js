// Airtable
//import { Airtable } from 'airtable';
//import { environment } from '../environment.js';
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var request = new XMLHttpRequest();
const environment = require('../environment.js');
const Airtable = require("airtable");
const base = new Airtable({ apiKey: environment.production.airtableKey }).base(environment.production.airtableBase);

class DataService {
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
          console.log(JSON.stringify(r));
          return { 
            id: r.id,
            timePerArtwork: r.get('TimePerArtworkSecs'),
            matColor: r.get('MatColor')
          }
        });
        if (settings.length > 0) {
          that.settings = settings[0];
        }
        that.loadAirTableBase('ArtSources');
      } else if (baseName === 'ArtSources') {
        // This function (`page`) will get called for each page of records.
        var newState = records.map(r => { 
          console.log(JSON.stringify(r));
          return { 
            id: r.id,
            name: r.get('Name'), 
            active: r.get('Active'),
            accessToken: r.get('AccessToken'), 
            departmentIDs: r.get('DepartmentIDs'), // eyebrow,
            departmentObjectAPI: r.get('DepartmentObjectAPI'),
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
    this.curDepartments = this.airTableData[curMuseumNum].departmentIDs.split(',');
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
    //var request = new XMLHttpRequest();
    request.open('GET', url, true);
    var that = this;
    request.onload = function() {
      // Begin accessing JSON data here
      var data = JSON.parse(this.response);
      if (request.status >= 200 && request.status < 400) {

        // The object terms that get us to the Object ID. 
        var nameArray = that.airTableData[that.curMuseumNum].departmentObjectField.split(',');
        
        //console.log('data: ' + JSON.stringify(data[nameArray[0]]));
        // Save the ObjectIDs
        var tempArray = [];
        tempArray = data[nameArray[0]];
        //console.log('tempArray: ' + tempArray);
        if (nameArray.length > 1) {
          for (var i = 0; i < tempArray.length; i++) {
            if (nameArray.length == 2) {
              if (tempArray[i][nameArray[1]] !== undefined && tempArray[i][nameArray[1]] !== '') {
                tempArray[i] = tempArray[i][nameArray[1]];
              }
            }
          }
        }

        // randomize the order of the object, so we get different results. 
        for(let i = tempArray.length - 1; i > 0; i--){
          const j = Math.floor(Math.random() * i)
          const temp = tempArray[i];
          tempArray[i] = tempArray[j];
          tempArray[j] = temp;
        }
        // Save some of the ObjectIDs for later
        var slicedArray = tempArray.slice(0,50);

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

      } else {
        console.log('error')
      }
    }

    request.send()
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
  getRandomImage(imageCallback) { ///// self, imageCallback) {
    
/////     this.callbackSelf = self;
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

    console.log('Object URL: ' + url);
    request.open('GET', url, true);
    request.responseType = "json";
    var that = this;

    // xhr.onload = () => {
    request.onload = function() {
      // Begin accessing JSON data here
      console.log('JSON response: ' + JSON.stringify(this.responseText));
      var data = JSON.parse (this.responseText);
      if (request.status >= 200 && request.status < 400) {

        console.log(JSON.stringify(data));
      
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

        that.curImageObject = {
          image: image,
          title: title,
          artist: artist,
          date: date,
          medium: medium,
          museumName: that.airTableData[curMuseumNum].name,
          objectID: tempObjectID
        };
       
        // Send the image back to the Display through its callback function
        that.imageCallback(); ///// that.callbackSelf);

      } else {
        console.log('error')
      }
    }
    request.send()
  }

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

  returnElement(data, element) {
    if (element.substr(-1) === 's') {
      // This is an array, send the first element for now
      if (data === undefined){
        return;
      } else {
        return data[element][0];
      }
    } else {
      if (data === undefined){
        return;
      } else {
        return data[element];
      }
    }
  }

  // Set active
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

  // Set art time
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
}

module.exports = DataService;


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