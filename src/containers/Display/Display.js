import React, { Component } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";

// Styles
import './style.scss';

// Airtable
import Airtable from 'airtable';
import { environment } from '../../environment.js';
const base = new Airtable({ apiKey: environment.production.airtableKey }).base(environment.production.airtableBase);

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
    this.setState({ art_data: artItems });
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

    this.loadAirTableBase('ArtSources');
  }

  componentWillUnmount() {
    socket.off("get_data");
    socket.off("change_data");
  }

  loadAirTableBase = (baseName) => {
    var that = this;
    base(baseName).select({
        // Selecting the first 3 records in Grid view:
        maxRecords: 100,
        view: "Grid view"
      }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        var newState = records.map(r => { 
          console.log(JSON.stringify(r.get('Name')));
          /*var bg_img = (r.get('Background Image') && r.get('Background Image')[0]) || {};
          var media = (r.get('Media')) || [];
          var eyebrow = (r.get('Eyebrow') === undefined) ? '' : r.get('Eyebrow'); 
          return { 
            title: r.get('Title'), 
            key: r.get('Identifier')[0], 
            eyebrow: r.get('Eyebrow'), // eyebrow,
            subtitle: r.get('Subtitle'),
            description: r.get('Description'),
            bg_color: r.get('Background Color'),
            media: media,
            bg_img: bg_img.url || 'https://placehold.it/1080x1920',
           } */
        })
        /*
        if (baseName === 'CaseStudies') {
          that.casestudies = newState;
          // Load the SFStudio content
          that.loadAirTableBase('SFStudio');
        } else if (baseName === 'SFStudio') {
          that.sfstudio = newState;
          // Load the Story content
          that.loadAirTableBaseStories();
        } */
    }, function done(err) {
        if (err) { console.error(err); return; }
    });
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
