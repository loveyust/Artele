import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";
import FrameMat from "../../components/FrameMat/FrameMat";

// Styles
import './style.scss';

// Socket Service Layer
import DataService from '../../services/data.service';
const dataService = new DataService();

class Display extends Component {
  constructor() {
    super();
    this.minMat = 150;
    this.state = {
      art_data: [],
      fadeClass: "fadedIn",
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
    this.screenWidth = 1920;
    this.fadeTime = 1000;
    this.artTime = 10000;
  }

  getData = artItems => {
//    console.log(artItems);
    this.setState({ art_data: artItems }); // from original
  };

  changeData = () => socket.emit("initial_data");

  componentDidMount() {
    console.log ('componente did mount');
    var state_current = this;
    socket.emit("initial_data");
    socket.on("get_data", this.getData);
    socket.on("change_data", this.changeData);

    // Timer
    this.imageInterval = setInterval(function(){
    }, this.artTime);
    clearInterval(this.imageInterval);

    this.fadeInterval = setInterval(function(){
    }, this.fadeTime);
    clearInterval(this.fadeInterval);

    dataService.loadData(this, this.museumDataLoaded);
  }

  museumDataLoaded (self) {
    console.log('Display: ALL DATA LOADED');
    self.showNextImage();
    // self.startTimer();
  }

  componentWillUnmount() {
    socket.off("get_data");
    socket.off("change_data");
  }

  markDone = id => {
    // console.log(predicted_details);
    socket.emit("mark_done", id);
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
    console.log('startTimer');
    var that = this;
    that.stopTimers();
    that.imageInterval = setInterval(function(){
      console.log('startTimer complete');
      that.stopTimers();
      that.fade();
    }, this.artTime);
  }

  stopTimers() {
    clearInterval(this.fadeInterval);
    clearInterval(this.imageInterval);
  }

  fade() {
    console.log("fade() " + this.state.fadeClass);
    // var fadeStr = (this.state.fadeClass === "fade fade-in") ? "fade fade-out" : "fade fade-in";
    this.setState({fadeClass: "fadedIn fade-in"}); // fadeStr});
    var that = this;
    that.stopTimers();
    that.fadeInterval = setInterval(function(){
      console.log('fadeTimer Complete');
      that.stopTimers();
      //if (that.state.fadeClass === "fadedIn fade-in") 
      that.showNextImage();
    }, this.fadeTime); 
  }

  showNextImage() {
    console.log("showNextImage() " + this.state.currentImage);
    /*var curImg = this.state.currentImage;
    if (this.state.currentImage === "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg") {
      curImg = "https://images.metmuseum.org/CRDImages/as/original/DP123730.jpg";
    } else {
      curImg = "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg";
    }
    this.setState({currentImage: curImg});*/

    dataService.getRandomImage(this, this.onObjectLoaded);
    //this.fade();
  }

  onObjectLoaded(self) {
    console.log("onObjectLoaded: " + JSON.stringify(dataService.curImageObject));
    self.setState({currentImage: dataService.curImageObject.image, currentImageData: dataService.curImageObject, fadeClass: "fadedOut fade-out"});
    //self.fade();
    self.startTimer();
  }
/*
  onImgLoad({target:img}) {
    console.log('onImgLoad');
    var imgScale = (1080.0 - (this.minMat * 2)) / img.height;
    var matWidth = (this.screenWidth - (imgScale * img.width)) / 2;
    matWidth = (matWidth < this.minMat) ? this.minMat : matWidth;
    this.setState({matStyle: {position: 'absolute', top: this.minMat, bottom: this.minMat, left: matWidth, right: matWidth}, fadeClass: "fade fade-out"});
  }
*/
  render() {
    return (
      <>
        <div className="img-parent">
          <div className={this.state.fadeClass}></div>
          <FrameMat data={this.state.currentImageData} />
         {/*<div className="frame">
            <div className="mat">
              <div className="art" style={this.state.matStyle}>
                <img onLoad={this.onImgLoad} src={this.state.currentImage}></img> 
              </div>
            </div>
          </div>*/}
        </div>
      </>
    );
  }
}

export default Display;
