// Airtable
import Airtable from 'airtable';
import { environment } from '../environment.js';
const base = new Airtable({ apiKey: environment.production.airtableKey }).base(environment.production.airtableBase);

export default class DataService {
  constructor() {
    const self = this;
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
  }

  loadData (self, callback) {
    this.numMuseums = 0;
    this.curMuseumNum = 0;
    this.callback = callback;
    this.callbackSelf = self;
    this.loadAirTableBase('ArtSources');
  } 

  loadAirTableBase = (baseName) => {
    var that = this;
    base(baseName).select({
      // Selecting the first 3 records in Grid view:
      maxRecords: 100,
      view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.
      var newState = records.map(r => { 
        console.log(JSON.stringify(r));
        return { 
          id: r.id,
          name: r.get('Name'), 
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
      this.callback(this.callbackSelf);
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
  getRandomImage(self, imageCallback) {
    
    this.callbackSelf = self;
    this.imageCallback = imageCallback;

    // Select a random museum
    var curMuseumNum = 0; // Math.floor(Math.random() * this.airTableData.length);

    console.log('getRandomImage: ' + curMuseumNum);

    // Select a random object from that museum's collection (from pre-filled object )

    var randomObjectNum = 0;
    var tempObjectID = '';
    while(tempObjectID === '' || tempObjectID === undefined) {
      randomObjectNum = Math.floor(Math.random() * this.airTableData[curMuseumNum].objectIDsArray.length);
      tempObjectID = this.airTableData[curMuseumNum].objectIDsArray[randomObjectNum];
    }
    var url = this.airTableData[curMuseumNum].objectAPI.replace("ObjectID", this.airTableData[curMuseumNum].objectIDsArray[randomObjectNum]);
    if (this.airTableData[curMuseumNum].accessToken !== undefined) {
      // Swap in the access token for this API if it is defined
      url = url.replace("AccessToken", this.airTableData[curMuseumNum].accessToken);
    }

    console.log('Object URL: ' + url);
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    var that = this;
    request.onload = function() {
      // Begin accessing JSON data here
      var data = JSON.parse(this.response);
      if (request.status >= 200 && request.status < 400) {


        /*
        // The object terms that get us to the Object ID. 
        var nameArray = that.airTableData[that.curMuseumNum].departmentObjectField.split(',');

        imageField:
        titleField:
        artistField:
        dateField: 
        mediumField:
        
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
        */
      
        // Image
        var image = data[that.airTableData[curMuseumNum].imageField];

        // Title
        var title = data[that.airTableData[curMuseumNum].titleField];

        // Artist
        var artist = data[that.airTableData[curMuseumNum].artistField];
        if (artist === '' || artist === undefined) {
          artist = 'Unknown';
        }

        // Date
        var date = data[that.airTableData[curMuseumNum].dateField];

        // Medium
        var medium = data[that.airTableData[curMuseumNum].mediumField];

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
       
        that.imageCallback(that.callbackSelf);

      } else {
        console.log('error')
      }
    }

    request.send()

    // After object has been found, reconcile differences between museum APIs

    // Send the image back to the Display through its callback function

  }
}







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