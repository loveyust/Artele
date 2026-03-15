import React, { Component } from "react";
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
    const hasLabel = typeof this.props.label === 'string' && this.props.label.trim().length > 0;

    return (
      <>
        <Toggle
          defaultChecked={this.props.active}
          aria-label={this.props.aria}
          onChange={() => this.props.onChange(!this.props.active, this.props.id)} />
        {hasLabel && <span>{this.props.label}</span>}
      </>
    );
  }
}

export default ToggleSwitch;
