import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";

// Styles
import './style.scss';

class FrameMat extends Component {
  constructor() {
    super();
    this.minMat = 150;
    this.state = {
      currentImage: "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg",
      // this is where we are connecting to with sockets,
      matStyle: {position: 'absolute', top: this.minMat, bottom: this.minMat, left: this.minMat, right: this.minMat}
    };
    this.screenWidth = 1920;
    this.onImgLoad = this.onImgLoad.bind(this);
  }


  componentDidMount() {
    
  }

  componentWillUnmount() {

  }

  onImgLoad({target:img}) {
    console.log('onImgLoad');
    var imgScale = (1080.0 - (this.minMat * 2)) / img.height;
    var matWidth = (this.screenWidth - (imgScale * img.width)) / 2;
    matWidth = (matWidth < this.minMat) ? this.minMat : matWidth;
    this.setState({matStyle: {position: 'absolute', top: this.minMat, bottom: this.minMat, left: matWidth, right: matWidth}, fadeClass: "fade fade-out"});
    this.props.callback();
  }

  render() {
    return (
      <div className="frame">
        <div className="mat">
          <div className="art" style={this.state.matStyle}>
            <img onLoad={this.onImgLoad} src={this.props.data.image}></img> {/*https://images.metmuseum.org/CRDImages/as/original/DP123730.jpg */}
          </div>
        </div>
      </div>
    );
  }
}

export default FrameMat;
