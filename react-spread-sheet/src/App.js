import React from "react";
import Table from "./Table/Table";
import { socket } from "./socket";




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
    if(this.username.current){
    }
    

    
    if (this.state.displayTable) {
      return (
        <div style={{ width: "max-content" }}>
          <Table x={4} y={4} displayName={this.username.current.value} />
        </div>
      );
    } else {
      return (
        <>
        <input
            type="text"
            placeholder="请输入您的用户名"
            ref={this.username} 
            />
          <button type="submit" onClick={this.handleLogin}>进入</button>
        </>
          
      );
    }
  }
}
