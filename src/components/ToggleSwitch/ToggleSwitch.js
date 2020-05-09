import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";

// Styles
import './style.scss';

class ToggleSwitch extends Component {
  constructor() {
    super();
    this.state = {
      
    };
    
  }


  componentDidMount() {
    
  }

  componentWillUnmount() {

  }

  handleToggle() {
    console.log("handleToggle");
  }

  render() {
    return (
      <div className="switch-container">
        <input
          checked={this.props.isOn}
          onChange={this.props.handleToggle}
          className="react-switch-checkbox"
          id={`react-switch-new`}
          type="checkbox"
        />
        <label
          style={{ background: this.props.isOn && '#06D6A0' }}
          className="react-switch-label"
          htmlFor={`react-switch-new`}
        >
          <span className={`react-switch-button`} />
        </label>
      </div>
    );
  }
}

export default ToggleSwitch;
