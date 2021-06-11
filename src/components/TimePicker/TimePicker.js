import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";

// Styles
import './style.scss';

class TimePicker extends Component {
  constructor() {
    super();
    this.state = {
      selectValue: 'select'
    };
  }

  componentDidMount() {  
  }

  componentWillUnmount() {
  }

  toggleActive = (active, id) => {
    console.log('set day active: ' + id + ' ' + active);
    /*let tempMuseumData = this.state.museumData;
    for (var i = 0; i < tempMuseumData.length; i++) {
      if (tempMuseumData[i].id === id) {
        tempMuseumData[i].active = active;
      }
    }*/

    // socket.emit("request_set_active", {active:active, id:id} );
    //this.setState({museumData: tempMuseumData});
  }

  handleChange = (e) => {
    this.setState({selectValue:e.target.value});
  }

  populateTimeOptions = () => {
    let options = [];
    for (let i = 0; i < 24; i++) {
      let fN = ("0" + i).slice(-2);
      options.push(<option key={i} value={i}>{fN}</option>);
    }
    return options;
  }

  render() {
    return (
      <div className="grid">
        <div className="col-6">
          <p className={"subheader"}>{this.props.label}</p>
        </div>
        <div className="col-6">
          <ToggleSwitch
            active={true}
            aria-label='No label tag'
            id={1}
            onChange={() => this.toggleActive(!true, 1)}
            label={""} />
        </div>
        <div className="col-3">
          <p className="description">AM On</p>
        </div>
        <div className="col-3">
          <select className="dropdown"
            value={this.props.amOnTime} 
            onChange={this.handleChange} >
            {this.populateTimeOptions()}
          </select>
        </div>
        <div className="col-3">
          <p className="description">AM Off</p>
        </div>
        <div className="col-3">
          <select className="dropdown"
            value={this.props.amOffTime} 
            onChange={this.handleChange} >
            {this.populateTimeOptions()}
          </select>
        </div>
        <div className="col-3">
          <p className="description">PM On</p>
        </div>
        <div className="col-3">
          <select className="dropdown"
            value={this.props.pmOnTime} 
            onChange={this.handleChange} >
            {this.populateTimeOptions()}
          </select>
        </div>
        <div className="col-3">
          <p className="description">PM Off</p>
        </div>
        <div className="col-3">
          <select className="dropdown"
            value={this.props.pmOffTime} 
            onChange={this.handleChange} >
            {this.populateTimeOptions()}
          </select>
        </div>
      </div>
    );
  }
}

export default TimePicker;