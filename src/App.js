import React, { Component } from "react";
import "./App.css";
import { Header } from "./global/header";
import { Switch, Route } from "react-router-dom";

import Display from "./containers/Display/Display";
import Artele from "./containers/Artele/Artele";

// import DataService from './services/data.service';

/*The <Route> component is the main part of React Router. 
Anywhere that you want to only render content based on the location’s pathname, 
you should use a <Route> element.
*/

/* The Route component expects a path prop, 
which is a string that describes the pathname that the route matches */

/* The <Switch> will iterate over routes and only render the first one that matches the current pathname */



class App extends Component {
  constructor() {
    super();
    this.state = {
      
    }
  }

  componentDidMount () {

  }

  render() {
    return (
      <div className="App">
        <Header />
        <div className="app-contents">
        <Switch>
          <Route exact path="/" render={(props) => <Artele {...props} />} />
          <Route path="/display" render={(props) => <Display {...props} />} />
          {/* <Route path="/display" component={Display} />*/}
        </Switch>
        </div>
      </div>
    );
  }
}

export default App;
