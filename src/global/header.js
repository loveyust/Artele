import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import socketIOClient from "socket.io-client";
//import DataService from '../services/data.]service';
import "./header.css";

// The Header creates links that can be used to navigate
// between routes.
var socket;


var data;

class Header extends Component { 
  constructor() {
    super();
    this.state = {
      endpoint: "http://localhost:3001/" // Update 3001 with port on which backend-my-app/server.js is running.
    };

    socket = socketIOClient(this.state.endpoint, { transports : ['websocket'] }); // "socket-serve--dev": "node server/server.js &",
    // data = new DataService();
    // data.loadData();
  }

  render() {
    return (
    <>
      {/*<header>
        <nav>
          <ul className="NavClass">
            <li>
              <NavLink exact to="/">
                Place Order
              </NavLink>
            </li>
            <li>
              <NavLink to="/updatepredicted">Change Predicted </NavLink>
            </li>
            <li>
              <NavLink to="/kitchen"> Kitchen </NavLink>
            </li>
          </ul>
        </nav>
      </header>*/}
    </>
    );
  }
}

export { Header, socket };
