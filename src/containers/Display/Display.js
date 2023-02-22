import React, { Component, useContext } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";
import FrameMat from "../../components/FrameMat/FrameMat";
import ArtInfo from "../../components/ArtInfo/ArtInfo";

// Styles
import './style.scss';

class Display extends Component {
  constructor() {
    super();
    this.minMat = 150;
    this.state = {
      art_data: [],
      fadeClass: "fadedIn fade-out",
      ////// currentImage: "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg",
      currentImageData: {
        image: "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg",
        title: "title",
        artist: "artist",
        date: "date",
        medium: "medium",
        museumName: "Met",
        objectName: "0000"
      },
      // Mat styles
      matStyle: {position: 'absolute', top: this.minMat, bottom: this.minMat, left: this.minMat, right: this.minMat}
    };
    this.screenWidth = 1920;
    this.fadeTime = 1000;
    this.onImageRendered = this.onImageRendered.bind(this);
    this.onImageData = this.onImageData.bind(this);
    this.imageData = {};
  }

  componentDidMount() {
    console.log ('Display component did mount');
    socket.on("send_random_image", this.onImageData);

    this.fadeInterval = setInterval(function(){
    }, this.fadeTime);
    clearInterval(this.fadeInterval);

    // When we start up lets get the first image right away
    socket.emit("request_random_image");
  }

  componentWillUnmount() {
    socket.off("send_settings_data", this.getSettingsData);
    socket.off("send_random_image", this.onImageData);
  }

  stopTimers() {
    clearInterval(this.fadeInterval);
  }

  fade() {
    console.log("fade() " + this.state.fadeClass);
    this.setState({fadeClass: "fadedIn fade-in"});
    var that = this;
    that.stopTimers();
    that.fadeInterval = setInterval(function(){
      console.log('fadeTimer Complete');
      that.stopTimers();
      that.showNextImage();
    }, this.fadeTime); 
  }

  showNextImage() {
    console.log("showNextImage() " + this.state.currentImageData.image);
    this.setState({currentImageData: this.imageData});
  }

  onImageData = imageData => {
    console.log("onImageData: " + JSON.stringify(imageData));
    // Wide Image Test imageData.image = 'https://images.metmuseum.org/CRDImages/aa/web-large/sfrl32.75.111_89269.jpg?'+Date.now();
    this.imageData = imageData;
    this.fade();
  }

  onImageRendered(){
    console.log('onImageRendered');
    this.setState({fadeClass: "fadedOut fade-out"});
  }

  render() {
    return (
      <>
        <div className="img-parent">
          <div className={this.state.fadeClass}></div>
          <FrameMat data={this.state.currentImageData} callback={this.onImageRendered} />
          <ArtInfo data={this.state.currentImageData} />
        </div>
      </>
    );
  }
}

export default Display;
