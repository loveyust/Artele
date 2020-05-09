import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";

// Styles
import './style.scss';

class TriggerButton extends Component {
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
        <button onClick={() => this.props.action}>{this.props.label}</button>
      </>
    );
  }
}

export default TriggerButton;