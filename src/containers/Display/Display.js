import React, { Component, useContext } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";
import FrameMat from "../../components/FrameMat/FrameMat";
import ArtInfo from "../../components/ArtInfo/ArtInfo";
import { DataConsumer, DataContext } from '../../data.context';

// Styles
import './style.scss';

// Socket Service Layer
// import DataService from '../../services/data.service';
// const dataService = new DataService();

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
      // this is where we are connecting to with sockets,
      matStyle: {position: 'absolute', top: this.minMat, bottom: this.minMat, left: this.minMat, right: this.minMat}
    };
    //this.data = new DataService();
    //this.data.loadData();
    // this.data = this.context.data;
    this.screenWidth = 1920;
    this.fadeTime = 1000;
    ///// this.artTime = 10000;

    this.onImageRendered = this.onImageRendered.bind(this);
/////    this.museumDataLoaded = this.museumDataLoaded.bind(this);
    //this.onObjectLoaded = this.onObjectLoaded(this);
    this.onImageData = this.onImageData.bind(this);
    this.getSettingsData = this.getSettingsData.bind(this);
    this.settings = null;

 
  }

  componentDidMount() {
    console.log ('Display component did mount');
    // socket.on("send_museum_data", this.getMuseumData);
    socket.on("send_settings_data", this.getSettingsData);
    socket.on("send_random_image", this.onImageData);
    socket.on("send_set_time", this.onSetTime);
    
    socket.emit("request_settings_data");
    
    // Get museum data
    // socket.emit("request_museum_data");
    
    // Timer
    this.imageInterval = setInterval(function(){
    }, 100 * 1000); 
    clearInterval(this.imageInterval);

    this.fadeInterval = setInterval(function(){
    }, this.fadeTime);
    clearInterval(this.fadeInterval);

    /*/////  
    // this.props.data.loadData(this, this.museumDataLoaded);
    this.props.museumData.registerDataLoadCallback(this, this.museumDataLoaded);
    */
  }

  /*/////
  getMuseumData = museumItems => {
    console.log(museumItems);
    // Get settings
    socket.emit("request_settings_data");
  };*/////

  getSettingsData = settingsData => {
    console.log('settingsData: ' + JSON.stringify(settingsData));
    console.log('Display: ALL DATA LOADED ');
    this.settings = settingsData;
    this.showNextImage();
  }

  onSetTime = timeSecs => {
    console.log ('Display onSetTime: ' + timeSecs);
    this.settings.timePerArtwork = timeSecs;
  }
I /*
  MuseumDataLoaded (self) {
    // Grab some settings
    console.log('Display: ALL DATA LOADED ');
 /////   self.showNextImage();
    self.startTimer();
    // this.props.museumData.test = false;
  }
*/
  componentWillUnmount() {
    socket.off("send_settings_data", this.getSettingsData);
    socket.off("send_random_image", this.onImageData);
  }

  // Timer to keep track of when to load next screen.
  startTimer = () => {
    var time = 10;
    if (this.settings !== null) {
      time = this.settings.timePerArtwork;
      console.log('startTimer ' + this.settings.timePerArtwork);
    }
    
    var that = this;
    that.stopTimers();
    that.imageInterval = setInterval(function(){
      console.log('startTimer complete');
      that.stopTimers();
      that.fade();
    }, time * 1000);
  }

  stopTimers() {
    clearInterval(this.fadeInterval);
    clearInterval(this.imageInterval);
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
    socket.emit("request_random_image");
    // this.props.museumData.getRandomImage(this, this.onObjectLoaded);
  }

  onImageData = imageData => {
    console.log("onImageData: " + JSON.stringify(imageData));
    this.setState({currentImageData: imageData});
  }

  /*/////
  onObjectLoaded(self) {
    if (self.props !== undefined) {
    console.log("onObjectLoaded: " + JSON.stringify(self.props.museumData.curImageObject));
    self.setState({currentImageData: self.props.museumData.curImageObject});
    }
  }
  */

  onImageRendered(){
    console.log('onImageRendered');
    this.setState({fadeClass: "fadedOut fade-out"});
    // TEMP remove for debuggin to limit API calls 
    // this.startTimer();
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
