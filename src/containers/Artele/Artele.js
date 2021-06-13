import React, { Component, useState } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";
import TriggerButton from "../../components/TriggerButton/TriggerButton";
import TimePicker from "../../components/TimePicker/TimePicker";
import styled from "styled-components";
import Toggle from 'react-toggle'

// Styles
import './style.scss';

class Artele extends Component {
  constructor() {
    super();
    this.state = {
      museumData: [],
      timeSecs: 10, 
      weekday: {},
      weekend: {},
      isLoaded: false
    };

    this.museumData = [];

   // this.museumDataLoaded = this.museumDataLoaded.bind(this);
///    this.getMuseumData = this.getMuseumData.bind(this);
    //this.getSettingsData = this.getSettingsData.bind(this);
  }

  componentDidMount() {
    socket.on("send_museum_data", this.getMuseumDataFromServer); 
    socket.on("send_settings_data", this.getSettingsData);
    // this.props.museumData.registerDataLoadCallback(this, this.museumDataLoaded);
    // Get museum data
    socket.emit("request_museum_data");
  }

  getMuseumDataFromServer = museumItems => {
    console.log('Artele getMuseumData: ' + JSON.stringify(museumItems));
    this.museumData = museumItems;

    // Get settings
    socket.emit("request_settings_data");
  };

  getSettingsData = settingsData => {
    console.log('Display: ALL DATA LOADED Artele: ' + JSON.stringify(settingsData.weekday));
    this.setState({
      museumData: this.museumData, 
      timeSecs: settingsData.timePerArtwork, 
      weekday: settingsData.weekday,
      weekend: settingsData.weekend,
      isLoaded:true
    });
  }

/*
  museumDataLoaded(self) {
    console.log('Artele musuemDataLoaded: ' + this.props.museumData.airTableData);
    this.setState({museumData: this.props.museumData.airTableData, timeSecs: this.props.museumData.settings.timePerArtwork});
  }
*/

  componentWillUnmount() {
    socket.off("send_museum_data", this.getMuseumData);
    socket.off("send_settings_data", this.getSettingsData);
  }

  toggleActive = (active, id) => {
    console.log('setmuseumactive: ' + id + ' ' + active);
    let tempMuseumData = this.state.museumData;
    for (var i = 0; i < tempMuseumData.length; i++) {
      if (tempMuseumData[i].id === id) {
        tempMuseumData[i].active = active;
      }
    }
    // Emit museum active
    socket.emit("request_set_active", {active:active, id:id} );
    this.setState({museumData: tempMuseumData});
  }

  getMuseumData() {
    console.log('getMuseumData: ' + JSON.stringify(this.state.museumData));
    if (this.state.museumData !== undefined) {
      return this.state.museumData.map(museum => {
        console.log('musum: ' + museum.active);
        return (
          <div className="col-12 grid" key={museum.id}>
            <div className="col-6"><p className="subheader">{museum.name}</p></div>
            <div className="col-6">
              <ToggleSwitch
                active={museum.active}
                aria-label='No label tag'
                id={museum.id}
                onChange={() => this.toggleActive(!museum.active, museum.id)}
                label={""} />
            </div>
          </div>
        );
      });
    } else {
      return;
    }
  }

  onUpdateImages() {
    console.log('Update Images: ');
    // TODO send flag to update images from Air Table in data service
    socket.emit('request_images_update')
  }

  onChangeSecs = (event) =>  {
    console.log('Change Seconds: ' + event.target.value);
    this.setState({timeSecs: event.target.value});
  }

  onUpdateSecs = (event) => {
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
    this.setState({
      weekday: newWeekday
    });

     console.log ('Artele onWeekdayCallback: ' + JSON.stringify(this.state.weekday));
  }

  onWeekendCallback = (val, num) => {
    let newWeekend = this.state.weekend;
    newWeekend[val] = num;
    this.setState({
      weekend: newWeekend
    });

     console.log ('Artele onWeekendCallback: ' + JSON.stringify(this.state.weekend));
  }

  render() {
    const isLoaded = this.state.isLoaded;
    return (
      <div className="artele-container">
          <div className="grid">
            <div className="artele-header col-12">
              <p className="title">Artele</p>
            </div>
            <div className="col-12">
              <p className="section-header">Timing</p>
            </div>
            { isLoaded ? 
              <>
                <div className="col-6">
                  <p className="description">Change the number of seconds each artwork is visible.</p>
                </div>
                <div className="col-6 interaction numInput">
                  <input
                    onChange={e => this.onChangeSecs(e)}
                    value={this.state.timeSecs}
                    type="number"
                    placeholder="Time in Secs"
                    min="0"
                  />
                  <TriggerButton action={() => this.onUpdateSecs()} label={"Update Secs"} />
                </div>
                <div className="col-6">
                  <p className="header">Schedule</p>
                </div>
                <div className="col-6">
                  <p className="header center">Active</p>
                </div>
                <div className="col-12">
                  <TimePicker 
                    label={"Weekday"} 
                    data={this.state.weekday}
                    toCallBack={(val, num) => this.onWeekdayCallback(val, num)}/>
                </div>
                <div className="col-12">
                  <TimePicker label={"Weekend"}
                    data={this.state.weekend}
                    toCallBack={(val, num) => this.onWeekendCallback(val, num)}/>
                </div>
                <div className="col-12">
                  <p className="section-header">Museum Images</p>
                </div>
                <div className="col-12">
                  <p className="header">Update Images</p>
                </div>
                <div className="col-6">
                  <p className="description">Update the stored image IDs for the museums.</p>
                </div>
                <div className="col-6 interaction">
                  <TriggerButton action={() => this.onUpdateImages()} label={"Update Images"} />
                </div>
                <div className="col-6">
                  <p className="header">Museum</p>
                </div>
                <div className="col-6">
                  <p className="header center">Active</p>
                </div>
                {this.getMuseumData()}
              </> :
              <>
              </>
            }
          </div>
      </div>
    );
  }
}
export default Artele;
