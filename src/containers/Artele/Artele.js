import React, { Component } from "react";
import { socket } from "../../global/header";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";
import TimePicker from "../../components/TimePicker/TimePicker";
import Tabs, {Tab} from 'react-best-tabs';
import 'react-best-tabs/dist/index.css';

// Styles
import './style.scss';

class Artele extends Component {
  constructor() {
    super();
    this.state = {
      museumData: [],
      timeSecs: 10,
      paused: false,
      weekday: {},
      weekend: {},
      isLoaded: false
    };

    this.museumData = [];
  }

  componentDidMount() {
    socket.on("send_museum_data", this.getMuseumDataFromServer);
    socket.on("send_settings_data", this.getSettingsData);
    socket.emit("request_museum_data");
  }

  getMuseumDataFromServer = museumItems => {
    console.log('Artele getMuseumData: ' + JSON.stringify(museumItems));
    this.museumData = museumItems;
    socket.emit("request_settings_data");
  };

  getSettingsData = settingsData => {
    console.log('Display: ALL DATA LOADED Artele: ' + JSON.stringify(settingsData.weekday));
    this.setState({
      museumData: this.museumData,
      timeSecs: settingsData.timePerArtwork,
      weekday: settingsData.weekday,
      weekend: settingsData.weekend,
      isLoaded: true,
      paused: settingsData.paused
    });
  }

  componentWillUnmount() {
    socket.off("send_museum_data", this.getMuseumData);
    socket.off("send_settings_data", this.getSettingsData);
  }

  toggleActive = (active, id) => {
    let tempMuseumData = this.state.museumData;
    for (var i = 0; i < tempMuseumData.length; i++) {
      if (tempMuseumData[i].id === id) {
        tempMuseumData[i].active = active;
      }
    }
    socket.emit("request_set_active", {active: active, id: id});
    this.setState({museumData: tempMuseumData});
  }

  onUpdateImages() {
    socket.emit('request_images_update');
  }

  onChangeSecs = (event) => {
    this.setState({timeSecs: event.target.value});
  }

  onUpdateSecs = () => {
    let numSecs = parseInt(this.state.timeSecs);
    if (numSecs <= 5) {
      numSecs = 5;
      this.setState({timeSecs: numSecs});
    }
    socket.emit('request_set_time', numSecs);
  }

  onWeekdayCallback = (val, num) => {
    let newWeekday = this.state.weekday;
    newWeekday[val] = num;
    this.setState({ weekday: newWeekday });
    socket.emit('request_set_schedule', {day: 'weekday', data: newWeekday});
  }

  onWeekendCallback = (val, num) => {
    let newWeekend = this.state.weekend;
    newWeekend[val] = num;
    this.setState({ weekend: newWeekend });
    socket.emit('request_set_schedule', {day: 'weekend', data: newWeekend});
  }

  onArtPause = () => {
    this.setState({paused: true});
    socket.emit('request_set_paused', true);
  }

  onArtPlay = () => {
    this.setState({paused: false});
    socket.emit('request_set_paused', false);
  }

  onReverse = () => {}
  onForward = () => {}

  onSave = () => {
    socket.emit('request_save_image');
  }

  renderMuseumData() {
    if (this.state.museumData !== undefined) {
      return this.state.museumData.map(museum => (
        <div className="museum-row" key={museum.id}>
          <div className="museum-meta">
            <p className="museum-name">{museum.name}</p>
            <p className="museum-status">{museum.active ? "Visible in rotation" : "Hidden from rotation"}</p>
          </div>
          <ToggleSwitch
            active={museum.active}
            aria-label='No label tag'
            id={museum.id}
            onChange={() => this.toggleActive(!museum.active, museum.id)}
            label={""} />
        </div>
      ));
    }
  }

  render() {
    const isLoaded = this.state.isLoaded;
    const paused = this.state.paused;

    return (
      <div className="artele-container">

        {/* ── Header ─────────────────────────────────── */}
        <div className="artele-header">
          <h1 className="artele-wordmark">Artele.</h1>
          <p className="artele-tagline">Gallery Remote</p>
          <div className={`artele-status${paused ? ' artele-status--paused' : ' artele-status--live'}`}>
            <span className="artele-status-dot"></span>
            <span className="artele-status-text">{paused ? 'PAUSED' : 'LIVE'}</span>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────── */}
        <Tabs activeTab="1" className="tab-background" ulClassName="" onClick={(event, tab) => console.log(event, tab)}>

          {/* ART ─────────────────────────────────────── */}
          <Tab title="ART" className="mr-3">
            <div className="mt-3">
              { isLoaded ?
                <div className="card-surface">
                  <p className="card-label">PLAYBACK</p>

                  <div className="transport-panel">
                    <button
                      className={`transport-btn${!paused ? ' is-active' : ''}`}
                      onClick={() => this.onArtPlay()}
                    >
                      <span className="t-sym">▶</span>
                      <span className="t-dot"></span>
                      <span className="t-lbl">PLAY</span>
                    </button>
                    <button
                      className={`transport-btn${paused ? ' is-active' : ''}`}
                      onClick={() => this.onArtPause()}
                    >
                      <span className="t-sym t-sym--pause"><i></i><i></i></span>
                      <span className="t-dot"></span>
                      <span className="t-lbl">PAUSE</span>
                    </button>
                    <button
                      className="transport-btn"
                      onClick={() => this.onReverse()}
                    >
                      <span className="t-sym t-sym--arrow">&lt;</span>
                      <span className="t-dot t-dot--hidden"></span>
                      <span className="t-lbl">PREV</span>
                    </button>
                    <button
                      className="transport-btn"
                      onClick={() => this.onForward()}
                    >
                      <span className="t-sym t-sym--arrow">&gt;</span>
                      <span className="t-dot t-dot--hidden"></span>
                      <span className="t-lbl">NEXT</span>
                    </button>
                  </div>

                  <button className="save-btn" onClick={() => this.onSave()}>
                    <span>SAVE TO SLACK</span>
                    <span className="save-btn-icon">
                      <i className="si si-1"></i>
                      <i className="si si-2"></i>
                      <i className="si si-3"></i>
                      <i className="si si-4"></i>
                    </span>
                  </button>
                </div>
              :
                <div className="loading-state">Loading...</div>
              }
            </div>
          </Tab>

          {/* IMAGES ──────────────────────────────────── */}
          <Tab title="IMAGES" className="mr-3">
            <div className="mt-3">
              { isLoaded ?
                <div className="card-surface">
                  <p className="card-label card-label--left">IMAGES</p>
                  <button className="action-btn stretch" onClick={() => this.onUpdateImages()}>
                    UPDATE IMAGES
                  </button>
                  <div className="museum-list-block">
                    <div className="list-head">
                      <span className="list-head-label">Museum</span>
                      <span className="list-head-label">Active</span>
                    </div>
                    <div className="stacked-list">
                      {this.renderMuseumData()}
                    </div>
                  </div>
                </div>
              :
                <div className="loading-state">Loading...</div>
              }
            </div>
          </Tab>

          {/* SCHEDULE ────────────────────────────────── */}
          <Tab title="SCHEDULE" className="mr-3">
            <div className="mt-3">
              { isLoaded ?
                <div className="card-surface">
                  <p className="card-label">SCHEDULE</p>

                  <div className="sched-row">
                    <div className="sched-row-label">
                      <p className="sched-title">Seconds per artwork</p>
                      <p className="sched-hint">Min. 5 seconds</p>
                    </div>
                    <div className="sched-input-group">
                      <input
                        className="sched-input"
                        onChange={e => this.onChangeSecs(e)}
                        value={this.state.timeSecs}
                        type="number"
                        min="0"
                      />
                      <button className="action-btn" onClick={() => this.onUpdateSecs()}>SET</button>
                    </div>
                  </div>

                  <div className="time-grid">
                    <div className="time-card">
                      <TimePicker
                        label={"Weekday"}
                        data={this.state.weekday}
                        toCallBack={(val, num) => this.onWeekdayCallback(val, num)}/>
                    </div>
                    <div className="time-card">
                      <TimePicker label={"Weekend"}
                        data={this.state.weekend}
                        toCallBack={(val, num) => this.onWeekendCallback(val, num)}/>
                    </div>
                  </div>
                </div>
              :
                <div className="loading-state">Loading...</div>
              }
            </div>
          </Tab>

        </Tabs>
      </div>
    );
  }
}
export default Artele;
