import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";

// Styles
import './style.scss';

class FrameMat extends Component {
  constructor() {
    super();
    this.minMat = 150;
    this.matColor = '#FFFF00';
    this.state = {
      currentImage: "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg",
      // this is where we are connecting to with sockets,
      matStyle: {position: 'absolute', top: this.minMat, bottom: this.minMat, left: this.minMat, right: this.minMat, background: this.matColor},
      matColor: {background: this.matColor}
    };
    this.screenWidth = 1920;
    this.onImgLoad = this.onImgLoad.bind(this);
//    this.colorThief = new ColorThief();
  }

  componentDidMount() {
    
  }

  componentWillUnmount() {

  }

  onImgLoad({target:img}) {
    console.log('onImgLoad: ' + this.props.data.matColor + ' ' + img.height + ' ' + img.width);
    var imgScale = (this.screenWidth - (this.minMat * 2)) / img.width;
    var matWidth = (imgScale > 1.0) ? (this.screenWidth - img.width) / 2 : this.minMat;
    var matHeight = (imgScale <= 1.0) ? (1080.0 - (imgScale * img.height)) / 2 : this.minMat;
    this.setState({matStyle: {position: 'absolute', top: matHeight, bottom: matHeight, left: matWidth, right: matWidth}, fadeClass: "fade fade-out", matColor: {background: this.props.data.matColor}});
    this.props.callback();
  }

  render() {
    return (
      <div className="frame">
        <div className="mat" style={this.state.matColor}>
          <div className="art" style={this.state.matStyle}>
            <img onLoad={this.onImgLoad} src={this.props.data.image}></img>
            {/*<img onLoad={this.onImgLoad} src="https://images.metmuseum.org/CRDImages/as/web-large/DP213279_CRD.jpg"></img> */}
          </div>
        </div>
      </div>
    );
  }
}

export default FrameMat;
