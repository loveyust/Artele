import React, { Component, useState } from "react";
import { Button, Table, Container } from "reactstrap";
import { socket } from "../../global/header";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";


// Styles
import './style.scss';

//const [value, setValue] = useState(false);

class Artele extends Component {
  constructor() {
    super();
    this.state = {
      food_data: [],
      value: false,
      // this is where we are connecting to with sockets,
    };
    //const [value, setValue] = useState(false);
    
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

  toggleActive = (id) => {
    console.log('setmuseumactive: ' + id);
    this.setState({value: !this.state.value});
  }

  getMuseumData() {
    return this.props.data.airTableData.map(museum => {
      return (
        <tr key={museum.id}>
          <td className="left"> {museum.name} </td>
          {/*<td>
            <input
              onChange={e => this.toggleActive(e, museum.id)}
              value={food.order}
              type="number"
              placeholder="Quantity"
            />
          </td>*/}
          <td className="right">
            <ToggleSwitch
              isOn={this.state.value}
              handleToggle={() => this.toggleActive(museum.id)}
            />
           {/* <button onClick={() => this.toggleActive(museum.id)}>Active</button>*/}
          </td>
        </tr>
      );
    });
  }

  render() {
    return (
      <div className="artele-container">
          <div className="grid">
            <div className="artele-header col-12">
              <p className="title">Artele</p>
            </div>
            <div className="col-12">
              <Table className="table">
                <thead>
                  <tr>
                    <th className="left">Museum</th>
                    <th className="right">Active</th>
                  </tr>
                </thead>
                <tbody>{this.getMuseumData()}</tbody>
              </Table>
            </div>
          </div>
      </div>
    );
  }
}
export default Artele;
