import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";

// Styles
import './style.scss';

class TriggerButton extends Component {
  constructor() {
    super();
    this.state = {
      buttonClass: ""
    };
  }

  componentDidMount() {  
    this.props.stretch ? 
    this.setState({buttonClass: "stretch"}) : 
    this.setState({buttonClass: ""});
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <>
        <button onClick={this.props.action} className={this.state.buttonClass}>{this.props.label}</button>
      </>
    );
  }
}

export default TriggerButton;