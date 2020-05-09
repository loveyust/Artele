import React, { Component } from "react";
import "./App.css";
import { Header } from "./global/header";
import { Switch, Route } from "react-router-dom";

import PlaceOrder from "./main/PlaceOrder";
import UpdatePredicted from "./main/UpdatePredicted";
import Kitchen from "./main/Kitchen";

import Display from "./containers/Display/Display";
import Artele from "./containers/Artele/Artele";

/*The <Route> component is the main part of React Router. 
Anywhere that you want to only render content based on the location’s pathname, 
you should use a <Route> element.
*/

/* The Route component expects a path prop, 
which is a string that describes the pathname that the route matches */

/* The <Switch> will iterate over routes and only render the first one that matches the current pathname */

// Airtable Data
import DataService from './services/data.service';
const dataService = new DataService();


class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <div className="app-contents">
        <Switch>
          <Route exact path="/" render={(props) => <Artele {...props} data={dataService} />} />
          <Route path="/updatepredicted" component={UpdatePredicted} />  
          <Route path="/kitchen" component={Kitchen} />
          <Route path="/display" render={(props) => <Display {...props} data={dataService} />} />
        </Switch>
        </div>
      </div>
    );
  }
}

export default App;
