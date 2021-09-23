import React, { Component } from "react";
import Table from "./Table/Table";
// import PropTypes from "prop-types";
// import App from './App'

class LoginApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      val: "",
      displayTable: false,
    };
  }

  onBlur = (e) => {
    this.setState({
      val: e.target.value,
      displayTable: true,
    });
  };

  render() {
    console.log(this.state.displayTable, "thisdisplay");
    if (this.state.displayTable) {
      return <Table />;
    } else {
      return (
        <>
          <h3>请输入您的用户名</h3>
          <input
            username={this.state.val}
            onBlur={this.onBlur}
            type="text"
            name="username"
          />
        </>
      );
    }
  }
}

export default LoginApp;
