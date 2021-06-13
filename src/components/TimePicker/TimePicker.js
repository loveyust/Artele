import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";

// Styles
import './style.scss';

class TimePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // active: props.active
    }
  }

  componentDidMount() {  
    // this.setState(data: this.props.data);
  }

  componentWillUnmount() {
  }

  toggleActive = (active) => {
    console.log('set day active:  ' + this.props.data.active);
    this.props.toCallBack("active", active);
    // this.setState({active: active});
    /* let tempMuseumData = this.state.museumData;
    for (var i = 0; i < tempMuseumData.length; i++) {
      if (tempMuseumData[i].id === id) {
        tempMuseumData[i].active = active;
      }
    } */

    // socket.emit("request_set_active", {active:active, id:id} );
    // this.setState({museumData: tempMuseumData});
  }

  setStateAndRunCallback = (val, num) => {
    this.props.toCallBack(val, num);
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
            active={this.props.data.active}
            aria-label='No label tag'
            id={1}
            onChange={() => this.toggleActive(!this.props.data.active)}
            label={""} />
        </div>
        <div className="col-3">
          <p className="description">AM On</p>
        </div>
        <div className="col-3">
          <select className="dropdown"
            value={this.props.data.amOn} 
            onChange={(e) => this.setStateAndRunCallback('amOn', e.target.value)} >
            {this.populateTimeOptions()}
          </select>
        </div>
        <div className="col-3">
          <p className="description">AM Off</p>
        </div>
        <div className="col-3">
          <select className="dropdown"
            value={this.props.data.amOff} 
            onChange={(e) => this.setStateAndRunCallback('amOff', e.target.value)} >
            {this.populateTimeOptions()}
          </select>
        </div>
        <div className="col-3">
          <p className="description">PM On</p>
        </div>
        <div className="col-3">
          <select className="dropdown"
            value={this.props.data.pmOn} 
            onChange={(e) => this.setStateAndRunCallback('pmOn', e.target.value)} >
            {this.populateTimeOptions()}
          </select>
        </div>
        <div className="col-3">
          <p className="description">PM Off</p>
        </div>
        <div className="col-3">
          <select className="dropdown"
            value={this.props.data.pmOff} 
            onChange={(e) => this.setStateAndRunCallback('pmOff', e.target.value)} >
            {this.populateTimeOptions()}
          </select>
        </div>
      </div>
    );
  }
}

export default TimePicker;