import React from "react";
import PropTypes from "prop-types";
import Row from "../Row/Row";
import { socket } from "../socket";
// import socketClient from "socket.io-client";

export default class Table extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data: {},
      displayName: props.displayName,
      sender: ''
    };
  }

  handleChangedCell = ({ x, y }, value) => {
    const modifiedData = Object.assign({}, this.state.data);
    if (!modifiedData[y]) modifiedData[y] = {};
    modifiedData[y][x] = value;
    this.setState({ data: modifiedData });
    this.sendMessage(modifiedData, this.props.displayName)
  };

  editEndChangedCell = ({ x, y }, value) => {
    const modifiedData = Object.assign({}, this.state.data);
    if (!modifiedData[y]) modifiedData[y] = {};
    modifiedData[y][x] = value;
    this.setState({ data: modifiedData });
    this.forceUpdate()
  };

  sendMessage = (sdata, sendername) => {
    socket.emit("skchange", { 
      data: sdata,
      sender: sendername
    });
  };

  updateCells = () => {
    this.forceUpdate();
  };



  componentDidMount() {
    socket.on("sknew", (sdata) => {
      this.setState({
        data: sdata.data,
        sender: sdata.sender
      })
      this.forceUpdate()
    });

    socket.on('editendcoming', (data) => {
      let [x,y] = [data.xycoor[0], data.xycoor[1]]
      this.editEndChangedCell({x, y}, data.newValue)  
    })
  }


  render() {
    const rows = [];
    for (let y = 0; y < this.props.y + 1; y += 1) {
      const rowData = this.state.data[y] || {};
      rows.push(
        <Row
          handleChangedCell={this.handleChangedCell}
          updateCells={this.updateCells}
          key={y}
          y={y}
          x={this.props.x + 1}
          rowData={rowData}
          displayName={this.props.displayName}
        />
      );
    }

    return <div>{rows}</div>;

  }
}

Table.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  displayName: PropTypes.string.isRequired,
};
