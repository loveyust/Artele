import { getDb } from './db/database.js';
import fetch from 'node-fetch';
import ColorThief from 'colorthief';
import axios from 'axios';
import { config } from './config.js';

const slackToken = config.slackToken;

export default class DataService {
  // DataService Singleton
  constructor() {
    if (DataService.instance) {
      return DataService.instance;
    }
    DataService.instance = this;

    this.loadingData = false;
    this.callbacks = [];
    this.imageInterval = setInterval(function() {}, 100 * 1000);
    clearInterval(this.imageInterval);
    console.log('DataService constructor');
    // Defer load so setCallback() is called before data arrives
    setImmediate(() => this.loadData());
    return this;
  }

  setCallback(callback, dataLoadedCallback) {
    this.imageCallback = callback;
    this.dataLoadedCallback = dataLoadedCallback;
  }

  registerDataLoadCallback(self, callback) {
    console.log('registerDataCallback: ' + this.callbacks.length);
    this.callbacks.push({ self, callback });
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

  loadData() {
    if (!this.loadingData) {
      this.loadingData = true;

      this.objectIDs = [];
      this.airTableData = [];
      this.numMuseums = 0;
      this.curMuseumNum = 0;
      this.curDepartments = [];
      this.curDepartmentNum = 0;
      this.curObjectString = '';
      this.curImageObject = null;
      this.dataLoaded = false;
      this.imageHistory = [];
      this.historyIndex = -1;

      this.timePerArtworkMS = 10000;
      this.matColor = '#333333';
      this.settings = {};

      console.log('DataService loadData()');

      const db = getDb();

      // Load settings
      const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
      if (!row) {
        console.warn('No settings row found in database.');
        this.loadingData = false;
        return;
      }

      this.settings = {
        id: row.id,
        name: row.name,
        timePerArtwork: row.timePerArtwork,
        matColor: row.matColor,
        paused: Boolean(row.paused),
        weekday: {
          active: Boolean(row.activeWeekday),
          amOn: row.amOnWeekday,
          amOff: row.amOffWeekday,
          pmOn: row.pmOnWeekday,
          pmOff: row.pmOffWeekday
        },
        weekend: {
          active: Boolean(row.activeWeekend),
          amOn: row.amOnWeekend,
          amOff: row.amOffWeekend,
          pmOn: row.pmOnWeekend,
          pmOff: row.pmOffWeekend
        }
      };

      this.dataLoadedCallback();

      // Load sources
      const sourceRows = db.prepare('SELECT * FROM sources').all();
      this.airTableData = sourceRows.map(r => ({
        id: r.id,
        name: r.name,
        active: Boolean(r.active),
        accessToken: r.accessToken || undefined,
        departmentIDs: r.departmentIDs || undefined,
        departmentObjectAPI: r.departmentObjectAPI || undefined,
        departmentArray: r.departmentArray || undefined,
        departmentObjectField: r.departmentObjectField || undefined,
        objectAPI: r.objectAPI,
        imageField: r.imageField,
        titleField: r.titleField,
        artistField: r.artistField,
        dateField: r.dateField,
        mediumField: r.mediumField,
        objectIDs: r.objectIDs || undefined,
        objectIDsArray: []
      }));

      this.numMuseums = this.airTableData.length;
      this.loadMuseum(this.curMuseumNum);
    }
  }

  loadMuseum(curMuseumNum) {
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
      this.dataLoaded = true;
      this.makeRegisteredCallbacks();
      this.getRandomImage(true);
    }
  }

  loadObjectsByDepartment(curMuseumNum, curDepartmentNum) {
    var url = this.airTableData[curMuseumNum].departmentObjectAPI.replace('DepartmentID', this.curDepartments[curDepartmentNum]);

    if (this.airTableData[curMuseumNum].accessToken !== undefined) {
      url = url.replace('AccessToken', this.airTableData[curMuseumNum].accessToken);
    }

    console.log(url + ' AT: ' + this.airTableData[curMuseumNum].accessToken);
    var that = this;
    fetch(url, {
      method: 'GET',
      headers: { ContentType: 'application/json' },
      referrer: 'no-referrer'
    }).then(response => response.json())
      .then(data => {
        if (that.airTableData[that.curMuseumNum] != undefined) {
          var objectNameArray = that.airTableData[that.curMuseumNum].departmentArray.split(',');

          var objectArray = data;
          if (objectNameArray.length > 0) {
            objectNameArray.forEach(element => {
              objectArray = objectArray[element];
            });
          }

          var objectFieldNameArray = [];
          var objectFieldArray = [];
          if (that.airTableData[that.curMuseumNum].departmentObjectField !== undefined) {
            objectFieldNameArray = that.airTableData[that.curMuseumNum].departmentObjectField.split(',');

            for (var i = 0; i < objectArray.length; i++) {
              objectFieldArray[i] = that.processElementArray(that, objectArray[i], objectFieldNameArray, '');
            }
          } else {
            objectFieldArray = objectArray;
          }

          // Randomize order
          for (let i = objectFieldArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            const temp = objectFieldArray[i];
            objectFieldArray[i] = objectFieldArray[j];
            objectFieldArray[j] = temp;
          }

          var slicedArray = objectFieldArray.slice(0, 100);
          that.curObjectString = that.curObjectString.concat(slicedArray.join() + ',');

          that.curDepartmentNum += 1;
          if (that.curDepartmentNum < that.curDepartments.length) {
            that.loadObjectsByDepartment(curMuseumNum, that.curDepartmentNum);
          } else {
            that.saveObjectIDs(curMuseumNum, that.curObjectString);
            that.loadNextMuseum();
          }
        }
      }).catch(err => {
        console.warn('Something went wrong. loadObjectsByDepartment', err);
        that.loadNextMuseum();
      });
  }

  saveObjectIDs(curMuseumNum, dataStr) {
    var tempStr = '' + dataStr;
    this.airTableData[curMuseumNum].objectIDsArray = tempStr.split(',');
    this.airTableData[curMuseumNum].objectIDs = tempStr;

    const db = getDb();
    db.prepare('UPDATE sources SET objectIDs = ? WHERE id = ?')
      .run(tempStr, this.airTableData[curMuseumNum].id);

    console.log('Saved objectIDs to DB for source:', this.airTableData[curMuseumNum].name);
  }

  getRandomImage(internal) {
    if (!this.airTableData || this.airTableData.length === 0) {
      console.warn('getRandomImage: airTableData not loaded');
      return;
    }

    const validSources = this.airTableData.filter(s => s.active && s.objectIDsArray && s.objectIDsArray.length > 0);
    if (validSources.length === 0) {
      console.warn('getRandomImage: no active sources with objects available');
      return;
    }
    const source = validSources[Math.floor(Math.random() * validSources.length)];
    const curMuseumNum = this.airTableData.indexOf(source);

    const randomObjectNum = Math.floor(Math.random() * source.objectIDsArray.length);
    const tempObjectID = source.objectIDsArray[randomObjectNum];

    var url = source.objectAPI.replace('ObjectID', encodeURIComponent(tempObjectID).replace(/%3A/gi, ':'));
    if (source.accessToken !== undefined) {
      url = url.replace('AccessToken', source.accessToken);
    }

    console.log('Object URL: ' + url);
    var that = this;
    fetch(url, {
      method: 'GET',
      headers: { ContentType: 'application/json' },
      referrer: 'no-referrer'
    }).then(response => response.json())
      .then(data => {
        const toStr = (val) => {
          if (val === null || val === undefined) return '';
          if (typeof val === 'string') return val;
          if (Array.isArray(val)) return val.join(', ');
          if (typeof val === 'object') return '';
          return String(val);
        };

        var imagePathArray = source.imageField.split(',');
        var image = that.processElementArray(that, data, imagePathArray, null);
        if (!image || typeof image !== 'string') {
          console.warn('getRandomImage: no image URL found, skipping to next');
          that.getRandomImage(false);
          return;
        }

        var titlePathArray = source.titleField.split(',');
        var title = toStr(that.processElementArray(that, data, titlePathArray, ''));

        var artistPathArray = source.artistField.split(',');
        var artist = toStr(that.processElementArray(that, data, artistPathArray, ''));
        if (!artist) artist = 'Unknown';

        var datePathArray = source.dateField.split(',');
        var date = toStr(that.processElementArray(that, data, datePathArray, ''));

        var mediumPathArray = source.mediumField.split(',');
        var medium = toStr(that.processElementArray(that, data, mediumPathArray, ''));

        var matColor = '#000000';
        var textColor = '#FFFFFF';

        that.curImageObject = {
          image,
          title,
          artist,
          date,
          medium,
          museumName: source.name,
          objectID: tempObjectID,
          matColor,
          textColor
        };

        // Fetch image into a Buffer so ColorThief (Jimp) can read it on Node.js
        fetch(image, { method: 'GET', referrer: 'no-referrer' })
          .then(res => res.arrayBuffer())
          .then(arrayBuf => ColorThief.getPalette(Buffer.from(arrayBuf), 2))
          .then(color => {
            var hex = that.rgbToHex(color[1][0], color[1][1], color[1][2]);
            matColor = hex;
            var hexInv = that.getContrast(matColor);
            textColor = hexInv;

            that.curImageObject.matColor = matColor;
            that.curImageObject.textColor = textColor;

            that._pushToHistory();
            that.imageCallback();

            if (!that.settings.paused) {
              that.startImageTimer();
            }
          })
          .catch(err => {
            console.log('ColorThiefError: ' + err);
            that._pushToHistory();
            that.imageCallback();
          });
      }).catch(err => {
        console.warn('Something went wrong. Skipping to next image.', err.message);
        that.getRandomImage(false);
      });
  }

  // Color helpers
  componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  }
  rgbToHex(r, g, b) {
    return '#' + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  }
  getContrast(hexcolor) {
    if (hexcolor.slice(0, 1) === '#') hexcolor = hexcolor.slice(1);
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
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
    const indexedMatch = element.match(/^(.+)\[(\d*)\]$/);
    if (indexedMatch) {
      const key = indexedMatch[1];
      const idx = indexedMatch[2] === '' ? 0 : parseInt(indexedMatch[2]);
      if (dataObj === undefined || dataObj[key] === undefined) return;
      return dataObj[key][idx];
    } else {
      if (dataObj === undefined) return;
      return dataObj[element];
    }
  }

  startImageTimer() {
    var time = 10;
    if (this.settings !== null) {
      time = this.settings.timePerArtwork;
    }

    var that = this;
    that.stopImageTimer();
    that.imageInterval = setInterval(function() {
      that.stopImageTimer();
      that.getRandomImage(true);
    }, time * 1000);
  }

  stopImageTimer() {
    clearInterval(this.imageInterval);
  }

  _pushToHistory() {
    // Truncate forward history if we branched mid-history
    if (this.historyIndex < this.imageHistory.length - 1) {
      this.imageHistory = this.imageHistory.slice(0, this.historyIndex + 1);
    }
    this.imageHistory.push({ ...this.curImageObject });
    if (this.imageHistory.length > 30) this.imageHistory.shift();
    else this.historyIndex++;
  }

  getPrevImage() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.curImageObject = this.imageHistory[this.historyIndex];
    this.stopImageTimer();
    this.imageCallback();
    if (!this.settings.paused) this.startImageTimer();
  }

  getNextImage() {
    if (this.historyIndex < this.imageHistory.length - 1) {
      this.historyIndex++;
      this.curImageObject = this.imageHistory[this.historyIndex];
      this.stopImageTimer();
      this.imageCallback();
      if (!this.settings.paused) this.startImageTimer();
    } else {
      this.stopImageTimer();
      this.getRandomImage(false);
    }
  }

  // ── Write methods ─────────────────────────────────────────

  setActive(active, id) {
    console.log('setActive: ' + active + ' ' + id);
    for (var i = 0; i < this.airTableData.length; i++) {
      if (id === this.airTableData[i].id) {
        this.airTableData[i].active = active;
        const db = getDb();
        db.prepare('UPDATE sources SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
        if (active && this.airTableData[i].objectIDsArray.length === 0) {
          this.reloadSourcePool(i);
        }
        break;
      }
    }
  }

  reloadSourcePool(idx) {
    const source = this.airTableData[idx];
    if (!source || !source.departmentIDs) return;
    console.log('reloadSourcePool: ' + source.name);

    const departments = source.departmentIDs.split(',');
    let deptNum = 0;
    let objectString = '';
    const that = this;

    const loadDept = () => {
      if (deptNum >= departments.length) {
        that.saveObjectIDs(idx, objectString);
        return;
      }
      let url = source.departmentObjectAPI.replace('DepartmentID', departments[deptNum]);
      if (source.accessToken !== undefined) {
        url = url.replace('AccessToken', source.accessToken);
      }
      fetch(url, { method: 'GET', headers: { ContentType: 'application/json' }, referrer: 'no-referrer' })
        .then(r => r.json())
        .then(data => {
          const objectNameArray = source.departmentArray.split(',');
          var objectArray = data;
          objectNameArray.forEach(el => { objectArray = objectArray[el]; });

          var objectFieldArray = [];
          if (source.departmentObjectField) {
            const fieldPath = source.departmentObjectField.split(',');
            for (var i = 0; i < objectArray.length; i++) {
              objectFieldArray[i] = that.processElementArray(that, objectArray[i], fieldPath, '');
            }
          } else {
            objectFieldArray = objectArray;
          }

          for (let i = objectFieldArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            [objectFieldArray[i], objectFieldArray[j]] = [objectFieldArray[j], objectFieldArray[i]];
          }

          objectString += objectFieldArray.slice(0, 100).join() + ',';
          deptNum++;
          loadDept();
        })
        .catch(err => {
          console.warn('reloadSourcePool failed:', source.name, err.message);
          deptNum++;
          loadDept();
        });
    };

    loadDept();
  }

  setArtTime(timeSecs) {
    console.log('setArtTime: ' + timeSecs);
    this.settings.timePerArtwork = timeSecs;
    const db = getDb();
    db.prepare('UPDATE settings SET timePerArtwork = ? WHERE id = 1').run(parseInt(timeSecs));
  }

  setSchedule(day, data) {
    console.log('setSchedule: ' + day + ' ' + JSON.stringify(data));
    this.settings[day] = data;
    const db = getDb();
    if (day === 'weekday') {
      db.prepare(`
        UPDATE settings SET
          activeWeekday = ?, amOnWeekday = ?, amOffWeekday = ?,
          pmOnWeekday = ?, pmOffWeekday = ?
        WHERE id = 1
      `).run(data.active ? 1 : 0, parseInt(data.amOn), parseInt(data.amOff), parseInt(data.pmOn), parseInt(data.pmOff));
    } else {
      db.prepare(`
        UPDATE settings SET
          activeWeekend = ?, amOnWeekend = ?, amOffWeekend = ?,
          pmOnWeekend = ?, pmOffWeekend = ?
        WHERE id = 1
      `).run(data.active ? 1 : 0, parseInt(data.amOn), parseInt(data.amOff), parseInt(data.pmOn), parseInt(data.pmOff));
    }
  }

  setPaused(paused) {
    console.log('setPaused: ' + paused);
    this.settings.paused = paused;
    this.settings.paused ? this.stopImageTimer() : this.startImageTimer();
    const db = getDb();
    db.prepare('UPDATE settings SET paused = ? WHERE id = 1').run(paused ? 1 : 0);
  }

  saveImage() {
    this.sendImageToSlack().catch(err => console.log(err));
  }

  async sendImageToSlack() {
    console.log('RUN sendImageToSlack()');
    let that = this;
    const url = 'https://slack.com/api/chat.postMessage';
    const res = await axios.post(url, {
      channel: '#artele',
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: 'Image from Artele' } },
        { type: 'section', text: { type: 'mrkdwn', text: JSON.stringify(that.curImageObject) } },
        { type: 'image', image_url: that.curImageObject.image, alt_text: 'Image Saved from Artele' }
      ],
    }, { headers: { authorization: `Bearer ${slackToken}` } });

    console.log('Done sent Image to Slack', res.data);
  }

  saveSource(sourceData) {
    const db = getDb();
    const fields = {
      name: sourceData.name || '',
      active: sourceData.active ? 1 : 0,
      accessToken: sourceData.accessToken || null,
      departmentIDs: sourceData.departmentIDs || null,
      departmentObjectAPI: sourceData.departmentObjectAPI || null,
      departmentArray: sourceData.departmentArray || null,
      departmentObjectField: sourceData.departmentObjectField || null,
      objectAPI: sourceData.objectAPI || '',
      imageField: sourceData.imageField || '',
      titleField: sourceData.titleField || '',
      artistField: sourceData.artistField || '',
      dateField: sourceData.dateField || '',
      mediumField: sourceData.mediumField || '',
      objectIDs: sourceData.objectIDs || null,
    };

    if (sourceData.id) {
      db.prepare(`
        UPDATE sources SET
          name=@name, active=@active, accessToken=@accessToken,
          departmentIDs=@departmentIDs, departmentObjectAPI=@departmentObjectAPI,
          departmentArray=@departmentArray, departmentObjectField=@departmentObjectField,
          objectAPI=@objectAPI, imageField=@imageField, titleField=@titleField,
          artistField=@artistField, dateField=@dateField, mediumField=@mediumField,
          objectIDs=@objectIDs
        WHERE id=@id
      `).run({ ...fields, id: sourceData.id });

      const idx = this.airTableData.findIndex(s => s.id === sourceData.id);
      if (idx !== -1) {
        this.airTableData[idx] = {
          ...this.airTableData[idx], ...fields,
          id: sourceData.id,
          active: Boolean(fields.active),
          objectIDsArray: fields.objectIDs ? fields.objectIDs.split(',').filter(Boolean) : this.airTableData[idx].objectIDsArray
        };
      }
    } else {
      const result = db.prepare(`
        INSERT INTO sources
          (name, active, accessToken, departmentIDs, departmentObjectAPI,
           departmentArray, departmentObjectField, objectAPI, imageField,
           titleField, artistField, dateField, mediumField, objectIDs)
        VALUES
          (@name, @active, @accessToken, @departmentIDs, @departmentObjectAPI,
           @departmentArray, @departmentObjectField, @objectAPI, @imageField,
           @titleField, @artistField, @dateField, @mediumField, @objectIDs)
      `).run(fields);

      this.airTableData.push({
        id: result.lastInsertRowid,
        ...fields,
        active: Boolean(fields.active),
        objectIDsArray: fields.objectIDs ? fields.objectIDs.split(',').filter(Boolean) : []
      });
    }
    console.log('saveSource done:', sourceData.name);
  }

  deleteSource(id) {
    const db = getDb();
    db.prepare('DELETE FROM sources WHERE id = ?').run(id);
    this.airTableData = this.airTableData.filter(s => s.id !== id);
    console.log('deleteSource done:', id);
  }

  async testSource(objectAPI, sampleId, accessToken) {
    try {
      let url = objectAPI.replace('ObjectID', encodeURIComponent(sampleId).replace(/%3A/gi, ':'));
      if (accessToken) url = url.replace('AccessToken', accessToken);
      console.log('testSource URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: { ContentType: 'application/json' },
        referrer: 'no-referrer'
      });
      return await response.json();
    } catch (err) {
      console.warn('testSource error:', err);
      return { error: err.message };
    }
  }

  clearSourceIds(id) {
    const db = getDb();
    db.prepare('UPDATE sources SET objectIDs = NULL WHERE id = ?').run(id);
    const idx = this.airTableData.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.airTableData[idx].objectIDs = undefined;
      this.airTableData[idx].objectIDsArray = [];
    }
    console.log('clearSourceIds done:', id);
  }

  clearImageData() {
    console.log('data clearImageData');
    const db = getDb();
    db.prepare('UPDATE sources SET objectIDs = NULL').run();
    for (var i = 0; i < this.airTableData.length; i++) {
      this.airTableData[i].objectIDs = undefined;
    }
    this.loadingData = false;
    this.loadData();
  }
}
