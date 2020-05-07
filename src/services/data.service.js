import { environment } from '../environment';

// Airtable
import Airtable from 'airtable';
import { environment } from '../environment.js';
const base = new Airtable({ apiKey: environment.production.airtableKey }).base(environment.production.airtableBase);

export default class DataService {
  constructor() {
    const self = this;
  }

  loadAirTableData () {
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
          console.log(JSON.stringify(r.get('Name')));
          /*var bg_img = (r.get('Background Image') && r.get('Background Image')[0]) || {};
          var media = (r.get('Media')) || [];
          var eyebrow = (r.get('Eyebrow') === undefined) ? '' : r.get('Eyebrow'); 
          return { 
            title: r.get('Title'), 
            key: r.get('Identifier')[0], 
            eyebrow: r.get('Eyebrow'), // eyebrow,
            subtitle: r.get('Subtitle'),
            description: r.get('Description'),
            bg_color: r.get('Background Color'),
            media: media,
            bg_img: bg_img.url || 'https://placehold.it/1080x1920',
           } */
        })
        /*
        if (baseName === 'CaseStudies') {
          that.casestudies = newState;
          // Load the SFStudio content
          that.loadAirTableBase('SFStudio');
        } else if (baseName === 'SFStudio') {
          that.sfstudio = newState;
          // Load the Story content
          that.loadAirTableBaseStories();
        } */
    }, function done(err) {
        if (err) { console.error(err); return; }
    });
  }

}