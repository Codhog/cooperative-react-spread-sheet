import React from "react";
import Table from "./Table/Table";
import { socket } from "./socket";
import './App.css';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.username = React.createRef();
    this.state = {
      displayTable: false,
    };
  }

  handleLogin = () => {
    socket.emit("getID", this.username.current.value);
    this.setState({
      displayTable: true,
    });
  };


  render() {
    if (this.username.current) {
    }



    if (this.state.displayTable) {
      return (
        <div style={{ width: "max-content" }}>
          <Table x={4} y={4} displayName={this.username.current.value} />
        </div>
      );
    } else {
      return (
        <div className="box">
          <h1>Cooperative Editing Sheet</h1>
          <input
            type="text"
            placeholder="Please type username"
            ref={this.username}
          />
          <button
            style={{
              marginTop: '20px',
              padding: '10px'
            }}
            type="submit" onClick={this.handleLogin}>Enter</button>
        </div>

      );
    }
  }
}
