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
  }

  loadAirTableData (callback) {
    this.numMuseums = 0;
    this.curMuseumNum = 0;
    this.callback = callback;
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
          objectAPI: r.get('ObjectAPI'),
          objectIDs: r.get('ObjectIDs'),
          imageField: r.get('ImageField'),
          titleField: r.get('title'),
          artistField: r.get('ArtistField'),
          dateField: r.get('DateField'),
          mediumField: r.get('MediumField')
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
    if (this.airTableData[curMuseumNum].objectIDs === undefined) {
      this.curDepartments = this.airTableData[curMuseumNum].departmentIDs.split(',');
      this.curDepartmentNum = 0;
      this.loadObjectsByDepartment(curMuseumNum, this.curDepartmentNum);
    } else {
      this.loadNextMuseum();
    }
  }

  loadNextMuseum() {
    this.curMuseumNum += 1;
    this.loadMuseum(this.curMuseumNum);
  }

  loadObjectsByDepartment(curMuseumNum, curDepartmentNum) {
    // figure out the URL and add accesstoken and departmentID
    var url = this.airTableData[curMuseumNum].departmentObjectAPI.replace("DepartmentID", this.curDepartments[curDepartmentNum]);
    var request = new XMLHttpRequest()
    request.open('GET', url, true)
    var that = this;
    request.onload = function() {
      // Begin accessing JSON data here
      var data = JSON.parse(this.response)
      if (request.status >= 200 && request.status < 400) {

        // Save the ObjectIDs
        var tempArray = [];
        tempArray = data.objectIDs;

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
        console.log(that.curObjectString);
        that.curDepartmentNum += 1;
        if (that.curDepartmentNum < that.curDepartments.length) {
          // Load the next department
          that.loadObjectsByDepartment(that.curMuseumNum, that.curDepartmentNum);
        } else {
          // Update AirTable with Objects
          that.uploadObjectsToAirTable(that.curMuseumNum, that.curObjectString);
        }

      } else {
        console.log('error')
      }
    }

    request.send()
  }

  uploadObjectsToAirTable(curMuseumNum, dataStr) {
    base('ArtSources').update([
      {
        "id": this.airTableData[curMuseumNum].id,
        "fields": {
          "ObjectIDs": dataStr
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