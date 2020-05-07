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

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <Switch>
          <Route exact path="/" component={Artele} />
          <Route path="/updatepredicted" component={UpdatePredicted} />  
          <Route path="/kitchen" component={Kitchen} />
          <Route path="/display" component={Display} />
        </Switch>
      </div>
    );
  }
}

export default App;
