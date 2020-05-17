import React, { Component, useState } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";
import TriggerButton from "../../components/TriggerButton/TriggerButton";
import styled from "styled-components";
import Toggle from 'react-toggle'

// Airtable Data
///// import DataService from '../../services/data.service';

// Styles
import './style.scss';

// const [value, setValue] = useState(false);

const Label = styled.label`
  font-weight: bold;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: min-content;
  white-space: nowrap;
  align-items: center;
  cursor: pointer;
`;

const Sample = styled.div`
  padding: 16px;
`;

const Root = styled.div`
  font-family: Arial, Helvetica, sans-serif;
  h1 {
    text-align: center;
  }

  h2 {
    padding-bottom: 4px;
    border-bottom: 1px solid #ccc;
  }
`;

class Artele extends Component {
  constructor() {
    super();
    this.state = {
      museumData: [],
      timeSecs: 10
    };

    this.museumData = [];

   // this.museumDataLoaded = this.museumDataLoaded.bind(this);
///    this.getMuseumData = this.getMuseumData.bind(this);
///    this.getSettingsData = this.getSettingsData.bind(this);
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
    console.log('Display: ALL DATA LOADED Artele');
    this.setState({museumData: this.museumData, timeSecs: settingsData.timePerArtwork});
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
/////    this.props.museumData.setActive(active, id);
    // this.setState({museumData: this.data.airTableData});
  }

  getMuseumData() {
    console.log('getMuseumData: ' + this.state.museumData);
    if (this.state.museumData !== undefined) {
      return this.state.museumData.map(museum => {
        console.log('musum: ' + museum.active);
        return (
          <tr key={museum.id}>
            <td className="left museum">{museum.name}</td>
            <td className="right museum">
              <ToggleSwitch
                active={museum.active}
                aria-label='No label tag'
                id={museum.id}
                onChange={() => this.toggleActive(!museum.active, museum.id)}
                label={""} />
            </td>
          </tr>
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
    if (parseInt(event.target.value) <= 5) {
      event.target.value = 5;
    }
    console.log('Change Seconds: ' + event.target.value);
//    this.props.museumData.setArtTime(event.target.value);
    socket.emit('request_set_time', event.target.value);
    this.setState({timeSecs: event.target.value});
    // TODO Add seconds to Airtable
  }

  render() {
    return (
      <div className="artele-container">
          <div className="grid">
            <div className="artele-header col-12">
              <p className="title">Artele</p>
            </div>
            <div className="col-12">
              <Table className="table-trigger">
                <tbody>
                  <tr>
                    <td className="left">
                      <p className="description">Change the number of seconds each artwork is visible.</p>
                    </td>
                    <td className="right">
                    <input
                      onChange={e => this.onChangeSecs(e)}
                      value={this.state.timeSecs}
                      type="number"
                      placeholder="Time in Secs"
                      min="0"
                    />
                    </td>
                  </tr>
                  <tr>
                    <td className="left">
                      <p className="description">Update the stored image IDs for the museums.</p>
                    </td>
                    <td className="right">
                      <TriggerButton action={() => this.onUpdateImages()} label={"Update Images"} />
                    </td>
                  </tr>
                  <tr>
                    <td className="left header">Museum</td>
                    <td className="right header">Active</td>
                  </tr>
                  {this.getMuseumData()}
                </tbody>
              </Table>
            </div>
          </div>
      </div>
    );
  }
}
export default Artele;
