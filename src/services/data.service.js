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
        console.log('AccessToken: ' + r.get('AccessToken'));
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
    this.curDepartments = this.airTableData[curMuseumNum].departmentIDs.split(',');
    this.curDepartmentNum = 0;
    if (this.airTableData[curMuseumNum].objectIDs === undefined) {
      this.loadObjectsByDepartment(curMuseumNum, this.curDepartmentNum);
    } else {
      this.loadNextMuseum();
    }
  }

  loadNextMuseum() {
    this.curMuseumNum += 1;
    this.curObjectString = [];
    if (this.curMuseumNum < this.airTableData.length) {
      this.loadMuseum(this.curMuseumNum);
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

       // console.log(nameArray + ' ' +JSON.stringify(tempArray));

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

  uploadObjectsToAirTable(curMuseumNum, dataStr) {
    console.log('AirTable datastr: '+ dataStr); 
    //dataStr = "18095365,18099297,18099855,18098321,18097811,18098117,18097277,18098225,18098369,18099999,18099153,18096577,18097169,18095353,18096589,18099507,18097551,18097917,18095473,18098833,18098439,18099691,18095543,18099913,18096471,18099343,18097455,18097373,18098871,18099545,18095459,18097931,18099139,18096483,18096729,18099653,18096919,18097183,18097429,18099893,18097695,18097791,18097289,18099045,18096849,18097323,18097227,18098605,18099285,18097309,,18135093,18209677,18206825,18206457,18210333,18106121,18189139,18187809,18185699,18187993,18205283,18208953,18134723,18206255,18209519,18206767,18209499,18103367,18209393,18134817,18206673,18135637,18185257,18188819,18189189,18210179,18205315,18105767,18185149,18189273,18187897,18210319,18189259,18209449,18190275,18210415,18185269,18135625,18209595,18185625,18209165,18205245,18134829,18206731,18134735,18190143,18206089,18209951,18135649,18210427,,1158792343,68268677,35520989,68743529,1158792341,68743525,1158792347,68250943,";
    var tempStr = '' + dataStr;
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