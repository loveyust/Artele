import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";

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
      fadeClass: "fade fade-out",
      currentImage: "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg",
      // this is where we are connecting to with sockets,
      matStyle: {position: 'absolute', top: this.minMat, bottom: this.minMat, left: this.minMat, right: this.minMat}
    };
    this.onImgLoad = this.onImgLoad.bind(this);
    this.screenWidth = 1920;
    this.fadeTime = 1000;
  }

  getData = artItems => {
    console.log(artItems);
    this.setState({ art_data: artItems }); // from original
  };

  changeData = () => socket.emit("initial_data");

  componentDidMount() {
    var state_current = this;
    socket.emit("initial_data");
    socket.on("get_data", this.getData);
    socket.on("change_data", this.changeData);

    // Timer
    this.imageInterval = setInterval(function(){
    }, 5000);
    clearInterval(this.imageInterval);
    this.startTimer();

    this.fadeInterval = setInterval(function(){
    }, this.fadeTime);
    clearInterval(this.fadeInterval);
    //this.fade();

    dataService.loadAirTableData();
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
    clearInterval(that.imageInterval);
    that.imageInterval = setInterval(function(){
      that.fade();
    }, 5000);
  }

  fade() {
    console.log("fade() " + this.state.fadeClass);
    var fadeStr = (this.state.fadeClass === "fade fade-in") ? "fade fade-out" : "fade fade-in";
    this.setState({fadeClass: fadeStr});
    var that = this;
    clearInterval(that.fadeInterval);
    that.fadeInterval = setInterval(function(){
      if (that.state.fadeClass === "fade fade-in") that.showNextImage();
      // else that.startTimer();
    }, this.fadeTime); 
  }

  showNextImage() {
    console.log("showNextImage() " + this.state.currentImage);
    var curImg = this.state.currentImage;
    if (this.state.currentImage === "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg") {
      curImg = "https://images.metmuseum.org/CRDImages/as/original/DP123730.jpg";
    } else {
      curImg = "https://images.metmuseum.org/CRDImages/as/original/DP123239.jpg";
    }
    this.setState({currentImage: curImg});
    // this.fade();
  }

  onImgLoad({target:img}) {
    console.log('onImgLoad');
    var imgScale = (1080.0 - (this.minMat * 2)) / img.height;
    var matWidth = (this.screenWidth - (imgScale * img.width)) / 2;
    matWidth = (matWidth < this.minMat) ? this.minMat : matWidth;
    this.setState({matStyle: {position: 'absolute', top: this.minMat, bottom: this.minMat, left: matWidth, right: matWidth}, fadeClass: "fade fade-out"});
  }

  render() {
    return (
      <>
        <div className="img-parent">
          <div className={this.state.fadeClass}></div>
          <div className="frame">
            <div className="mat">
              <div className="art" style={this.state.matStyle}>
                <img onLoad={this.onImgLoad} src={this.state.currentImage}></img> {/*https://images.metmuseum.org/CRDImages/as/original/DP123730.jpg */}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Display;
