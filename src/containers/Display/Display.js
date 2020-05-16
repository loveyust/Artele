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
      currentImage: "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg",
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
    this.museumDataLoaded = this.museumDataLoaded.bind(this);
    //this.onObjectLoaded = this.onObjectLoaded(this);
  }

  getMuseumData = museumItems => {
    console.log(museumItems);
    // this.setState({ art_data: artItems }); // from original
    socket.emit("request_settings_data");
  };

  getSettingsData = settingsData => {
    console.log('settingsData: ' + JSON.stringify(settingsData));
  }

  componentDidMount() {
    console.log ('componente did mount');
    var state_current = this;
    
    socket.on("send_museum_data", this.getMuseumData);
    socket.on("send_settings_data", this.getSettingsData);
    socket.emit("request_museum_data");
///    socket.on("change_data", this.changeData);

    // Timer
  /*/////  this.imageInterval = setInterval(function(){
    }, this.props.museumData.settings.timePerArtwork * 1000); 
    clearInterval(this.imageInterval);

    this.fadeInterval = setInterval(function(){
    }, this.fadeTime);
    clearInterval(this.fadeInterval);

    // this.props.data.loadData(this, this.museumDataLoaded);
    this.props.museumData.registerDataLoadCallback(this, this.museumDataLoaded);
  */
  }

  museumDataLoaded (self) {
    // Grab some settings
    ///// self.artTime = this.props.data.timePerArtworkMS;
    console.log('Display: ALL DATA LOADED ');
    self.showNextImage();
    // self.startTimer();
    this.props.museumData.test = false;
  }

  componentWillUnmount() {
///    socket.off("get_data");
///    socket.off("change_data");
  }

  markDone = id => {
    // console.log(predicted_details);
////    socket.emit("mark_done", id);
  };

  getArtData() {
    return this.state.art_data.map(art => {
      return (
        <tr key={art._id}>
          <td> {art.name} </td>
          {/*<td> {food.ordQty} </td>
          <td> {food.prodQty} </td>
          <td> {food.predQty} </td>
          <td>
            <button onClick={() => this.markDone(food._id)}>Done</button>
          </td>*/}
        </tr>
      );
    });
  }

  // Timer to keep track of when to load next screen.
  startTimer = () => {
    console.log('startTimer ' + this.props.museumData.settings.timePerArtwork);
    var that = this;
    that.stopTimers();
    that.imageInterval = setInterval(function(){
      console.log('startTimer complete');
      that.stopTimers();
      that.fade();
    }, this.props.museumData.settings.timePerArtwork * 1000);
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
    console.log("showNextImage() " + this.state.currentImage);
    this.props.museumData.getRandomImage(this, this.onObjectLoaded);
  }

  onObjectLoaded(self) {
    if (self.props !== undefined) {
    console.log("onObjectLoaded: " + JSON.stringify(self.props.museumData.curImageObject));
    self.setState({currentImage: self.props.museumData.curImageObject.image, currentImageData: self.props.museumData.curImageObject});
    }
  }

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
