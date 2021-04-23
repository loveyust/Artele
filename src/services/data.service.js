// Airtable
//import { Airtable } from 'airtable';
//import { environment } from '../environment.js';
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var requestImage = new XMLHttpRequest();
const environment = require('../environment.js');
const Airtable = require("airtable");
const fetch = require("node-fetch");
const base = new Airtable({ apiKey: environment.production.airtableKey }).base(environment.production.airtableBase);

/*
fetch('https://jsonplaceholder.typicode.com/posts').then(function (response) {
	// The API call was successful!
	return response.json();
}).then(function (data) {
	// This is the JSON from our response
	console.log(data);
}).catch(function (err) {
	// There was an error
	console.warn('Something went wrong.', err);
});
*/

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
          // console.log(JSON.stringify(r));
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
          // console.log(JSON.stringify(r));
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
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    var that = this;
    request.onload = function() {
      // Begin accessing JSON data here
      var data = JSON.parse(this.responseText);
      if (request.status >= 200 && request.status < 400) {

        // The object terms that get us to the Object ID. 
        var objectNameArray = that.airTableData[that.curMuseumNum].departmentArray.split(',');
        

        console.log('data: ' + JSON.stringify(objectNameArray));
        // Save the ObjectIDs
        var objectArray = data;
        if (objectNameArray.length > 0) {
          objectNameArray.forEach(element => {
            objectArray = objectArray[element];
            console.log('data3: ' + JSON.stringify(objectArray));
          });
        }
        
/*      var objectArray;
        if (objectNameArray.length === 1) {
          objectArray = data[objectNameArray[0]];
        } else if (objectNameArray.length > 1) {
          objectArray = data;
          // objectArray = that.processElementArray(that, data, objectNameArray, '');
          objectNameArray.forEach(element => {
            if (element.substr(-2) === '[]') {
              objectArray = objectArray[element.substr(-2)];
            } else {
              objectArray = objectArray[element];
            }
          });

        }
*/
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


        console.log('objectFieldArray: ' + objectFieldArray);
/*
        tempArray = data[nameArray[0]];

        if (nameArray.length > 1) {
          for (var i = 0; i < tempArray.length; i++) {
            if (nameArray.length == 2) {
              if (tempArray[i][nameArray[1]] !== undefined && tempArray[i][nameArray[1]] !== '') {
                tempArray[i] = tempArray[i][nameArray[1]];
              }
            }
          }
        }
*/
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
/*
    fetch(url).then(function (response) {
      // The API call was successful!
      return response.json();
    }).then(function (data) {
      // This is the JSON from our response
      console.log('FETCH: ' + JSON.stringify(data));
    }).catch(function (err) {
      // There was an error
      console.warn('Something went wrong.', err);
    });
*/

    //// test header problem 
    ////url = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/56602';
    ////console.log('Object URL: ' + url);
////    requestImage.open('GET', url, true);
////    requestImage.responseType = "json";
    var that = this;
////    requestImage.onload = function() {

      // Begin accessing JSON data here
      // console.log('JSON response: ' + JSON.stringify(this.responseText));
    fetch(url, {
      method: 'GET',
      headers: {
        ContentType: 'application/json'
      },
      referrer: 'no-referrer'
      //httpOptions: {insecureHTTPParser: true}//,
      //insecureHTTPParser: true
    }).then(function (response) {
      // The API call was successful!
      return response.json();
    }).then(function (data) {
      // This is the JSON from our response
      console.log('FETCH: ' + JSON.stringify(data));
////      var data = JSON.parse (this.responseText);
////      if (requestImage.status >= 200 && requestImage.status < 400) {

        // console.log(JSON.stringify(data));
      
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
        that.imageCallback();

////      } else {
////        console.log('error')
////      }
    ////}
    //// requestImage.send()
    }).catch(function (err) {
      // There was an error
      console.warn('Something went wrong.', err);
    });
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

  returnElement(dataObj, element) {
    if (element.substr(-2) === '[]') {
      // This is an array, send the first element for now
      console.log('returnElement data element: '+ JSON.stringify(dataObj) + ' ' + element);
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