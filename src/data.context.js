import React, { createContext } from 'react';
// import DataService from './services/data.service';

export const DataContext = createContext({
  data: {}
  //updateUsername: () => {},
});

export class DataProvider extends React.Component {
/*  updateUsername = newUsername => {
    this.setState({ username: newUsername });
  };
*/

  state = {
    // data: new DataService(),
    // updateUsername: this.updateUsername,
  };

  render() {
    return (
      <DataContext.Provider value={this.state}>
        {this.props.children}
      </DataContext.Provider>
    );
  }
}

export const DataConsumer = DataContext.Consumer;