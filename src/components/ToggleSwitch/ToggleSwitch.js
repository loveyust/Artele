import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";
import Toggle from 'react-toggle'

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

  render() {
    return (
      <>
        <Toggle
          defaultChecked={this.props.active}
          aria-label={this.props.aria}
          onChange={() => this.props.onChange(!this.props.active, this.props.id)} />
        <span>{this.props.label}</span>
      </>
    );
  }
}

export default ToggleSwitch;
