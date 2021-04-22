import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";

// Styles
import './style.scss';

class ArtInfo extends Component {
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
      <div className="art-block">
        <p className="art-text art-museum">{this.props.data.museumName}</p>
        <p className="art-text art-title">{this.props.data.title}</p>
        <p className="art-text">{this.props.data.artist}</p>
        <p className="art-text">{this.props.data.date}</p>
        {!!(this.props.data.medium) ?
          <p className="art-text art-medium">{this.props.data.medium.substring(0, 280) + '...'}</p> :
          <p className="art-text art-medium">""</p>
        }
      </div>
    );
  }
}

export default ArtInfo;
