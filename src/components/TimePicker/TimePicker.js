import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";

// Styles
import './style.scss';

class TimePicker extends Component {
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
        <p>{this.props.label}</p>
      </>
    );
  }
}

export default TimePicker;