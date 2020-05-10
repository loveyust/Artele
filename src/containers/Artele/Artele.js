import React, { Component, useState } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";
import TriggerButton from "../../components/TriggerButton/TriggerButton";
import styled from "styled-components";
import Toggle from 'react-toggle'

// Styles
import './style.scss';

// const [value, setValue] = useState(false);

const Label = styled.label`
  font-weight: bold;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: min-content;
  white-space: nowrap;
  align-items: center;
  cursor: pointer;
`;

const Sample = styled.div`
  padding: 16px;
`;

const Root = styled.div`
  font-family: Arial, Helvetica, sans-serif;
  h1 {
    text-align: center;
  }

  h2 {
    padding-bottom: 4px;
    border-bottom: 1px solid #ccc;
  }
`;

class Artele extends Component {
  constructor() {
    super();
    this.state = {
      food_data: [],
      value: false,
      museumData: [],
      timeSecs: 10
      // this is where we are connecting to with sockets
    };
    //const [value, setValue] = useState(false);
    this.museumDataLoaded = this.museumDataLoaded.bind(this);
  }
  getData = foodItems => {
    console.log(foodItems);
    foodItems = foodItems.map(food => {
      food.order = 0;
      return food;
    });
    this.setState({ food_data: foodItems });
  };
  componentDidMount() {
    socket.emit("initial_data");
    var state_current = this;
    socket.on("get_data", state_current.getData);

    this.props.data.registerDataLoadCallback(this, this.museumDataLoaded);
  }

  museumDataLoaded(self) {
    console.log('Artele musuemDataLoaded: ' + self.airTableData);
    this.setState({museumData: this.props.data.airTableData, timeSecs: this.props.data.settings.timePerArtwork});
  }

  componentWillUnmount() {
    socket.off("get_data", this.getData);
  }
  //Function to place the order.
  sendOrder = id => {
    var order_details;
    this.state.food_data.map(food => {
      if (food._id == id) {
        order_details = food;
      }
      return food;
    });
    console.log(order_details);
    socket.emit("putOrder", order_details);
    var new_array = this.state.food_data.map(food => {
      food.order = 0;
      return food;
    });
    this.setState({ food_data: new_array });
  };
  // Changing the quantity in the state which is emitted to the backend at the time of placing the order.
  changeQuantity = (event, foodid) => {
    if (parseInt(event.target.value) < 0) {
      event.target.value = 0;
    }
    var new_array = this.state.food_data.map(food => {
      if (food._id == foodid) {
        food.order = parseInt(event.target.value);
      }
      return food;
    });
    this.setState({ food_data: new_array });
  };
  // To get the initial data

  getFoodData() {
    return this.state.food_data.map(food => {
      return (
        <tr key={food._id}>
          <td> {food.name} </td>
          <td>
            <input
              onChange={e => this.changeQuantity(e, food._id)}
              value={food.order}
              type="number"
              placeholder="Quantity"
            />
          </td>
          <td>
            <button onClick={() => this.sendOrder(food._id)}>Order</button>
          </td>
        </tr>
      );
    });
  }

  toggleActive = (active, id) => {
    console.log('setmuseumactive: ' + id + ' ' + active);
    this.props.data.setActive(active, id);
    // this.setState({museumData: this.props.data.airTableData});
  }

  getMuseumData() {
    console.log('getMuseumData: ' + this.props.data.airTableData);
    if (this.props.data.airTableData !== undefined) {
      return this.props.data.airTableData.map(museum => {
        console.log('musum: ' + museum.active);
        return (
          <tr key={museum.id}>
            <td className="left museum">{museum.name}</td>
            <td className="right museum">
              <ToggleSwitch
                active={museum.active}
                aria-label='No label tag'
                id={museum.id}
                onChange={() => this.toggleActive(!museum.active, museum.id)}
                label={""} />
            </td>
          </tr>
        );
      });
    } else {
      return;
    }
  }

  onUpdateImages() {
    console.log('Update Images: ' + this.props.data.test);
    // TODO send flag to update images from Air Table in data service
  }

  onChangeSecs = (event) =>  {
    if (parseInt(event.target.value) <= 5) {
      event.target.value = 5;
    }
    console.log('Change Seconds: ' + event.target.value);
    this.props.data.setArtTime(event.target.value);
    this.setState({timeSecs: event.target.value});
    // TODO Add seconds to Airtable
  }

  render() {
    return (
      <div className="artele-container">
          <div className="grid">
            <div className="artele-header col-12">
              <p className="title">Artele</p>
            </div>
            <div className="col-12">
              <Table className="table-trigger">
                <tbody>
                  <tr>
                    <td className="left">
                      <p className="description">Change the number of seconds each artwork is visible.</p>
                    </td>
                    <td className="right">
                    <input
                      onChange={e => this.onChangeSecs(e)}
                      value={this.state.timeSecs}
                      type="number"
                      placeholder="Time in Secs"
                      min="0"
                    />
                    </td>
                  </tr>
                  <tr>
                    <td className="left">
                      <p className="description">Update the stored image IDs for the museums.</p>
                    </td>
                    <td className="right">
                      <TriggerButton action={() => this.onUpdateImages()} label={"Update Images"} />
                    </td>
                  </tr>
                  <tr>
                    <td className="left header">Museum</td>
                    <td className="right header">Active</td>
                  </tr>
                  {this.getMuseumData()}
                </tbody>
              </Table>
            </div>
          </div>
      </div>
    );
  }
}
export default Artele;
