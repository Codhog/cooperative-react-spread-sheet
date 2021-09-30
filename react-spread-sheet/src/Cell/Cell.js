import React from "react";
import PropTypes from "prop-types";
import { socket } from "../socket";
/**
 * Cell represents the atomic element of a table
 */

export default class Cell extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      value: props.value,
      typingName: '',
      currentXy: []
    };
    this.display = this.determineDisplay(
      { x: props.x, y: props.y },
      props.value
    );
    this.timer = 0;
    this.delay = 200;
    this.prevent = false;
  }

  /**
   * Add listener to the `unselectAll` event used to broadcast the
   * unselect all event
   */
  componentDidMount() {
    console.log('cell', this.props.displayName);
    window.document.addEventListener("unselectAll", this.handleUnselectAll);

    socket.on('skeditcoming', (data) => {
      console.log('接受修改信号', data);
      // 取消其他选中框
      this.emitUnselectAllEvent();
      this.setState({
        typingName: data.dataName,
        currentXy: [...data.dataCoor],
        editing: true
      })
    })

    socket.on('editendcoming', (data) => {
      console.log(data, 'editendcoming+_+_+');
      this.props.onChangedValue(
        {
          x: data.xycoor[0],
          y: data.xycoor[1],
        },
        data.newValue
      );
      this.setState({
        typingName: '',
        currentXy: [],
        // value:data.newValue,
        editing: false
      })
    })

  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { value } = nextProps
    if (value.length > 0) {
      return {
        editing: true,
        value: value,
      }

    }
    return null

  }
  componentWillUnmount() {
    window.document.removeEventListener("unselectAll", this.handleUnselectAll);
  }

  /**
   * When a Cell value changes, re-determine the display value
   * by calling the formula calculation
   */
  onChange = (e) => {
    this.setState({ value: e.target.value });
    this.display = this.determineDisplay(
      { x: this.props.x, y: this.props.y },
      e.target.value
    );
  };

  /**
   * Handle pressing a key when the Cell is an input element
   */
  onKeyPressOnInput = (e) => {
    if (e.key === "Enter") {
      this.hasNewValue(e.target.value);
    }
  };

  /**
   * Handle pressing a key when the Cell is a span element,
   * not yet in editing mode
   */
  onKeyPressOnSpan = () => {
    if (!this.state.editing) {
      this.setState({ editing: true });
    }
  };

  /**
   * Handle moving away from a cell, stores the new value
   */
  onBlur = (e) => {
    socket.emit('editend', {
      'xycoor': [this.props.x, this.props.y],
      'newValue': e.target.value
    })
    this.hasNewValue(e.target.value);
  };

  /**
   * Used by `componentDid(Un)Mount`, handles the `unselectAll`
   * event response
   */
  handleUnselectAll = () => {
    if (this.state.selected || this.state.editing) {
      this.setState({ selected: false, editing: false });
    }
  };

  /**
   * Called by the `onBlur` or `onKeyPressOnInput` event handlers,
   * it escalates the value changed event, and restore the editing
   * state to `false`.
   * 输入结束
   */
  hasNewValue = (value) => {

    this.props.onChangedValue(
      {
        x: this.props.x,
        y: this.props.y,
      },
      value
    );
    this.setState({ editing: false });
  };

  /**
   * Emits the `unselectAll` event, used to tell all the other
   * cells to unselect
   */
  emitUnselectAllEvent = () => {
    const unselectAllEvent = new Event("unselectAll");
    window.document.dispatchEvent(unselectAllEvent);
  };


  /**
   * Handle clicking a Cell.
   */
  clicked = () => {
    // Prevent click and double click to conflict
    this.emitUnselectAllEvent();
    
    this.timer = setTimeout(() => {
      if (!this.prevent) {
        // Unselect all the other cells and set the current
        // Cell state to `selected`
        this.emitUnselectAllEvent();
        this.setState({ selected: true });
      }
      this.prevent = false;
    }, this.delay);

  };

  /**
   * Handle doubleclicking a Cell.
   */
  doubleClicked = () => {
    // Prevent click and double click to conflict
    clearTimeout(this.timer);
    this.prevent = true;
    this.emitUnselectAllEvent();
    this.setState({ editing: true, selected: true });
    // Unselect all the otfher cells and set the current
    // Cell state to `selected` & `editing`
    // 双击格子后 发送信号
    socket.emit('skediting', {
      'dataName': this.props.displayName,
      'dataCoor': [this.props.x, this.props.y]
    })
  };




  determineDisplay = ({ x, y }, value) => {
    return value;
  };

  /**
   * Calculates a cell's CSS values
   */
  calculateCss = () => {
    const css = {
      width: "80px",
      padding: "4px",
      margin: "0",
      height: "25px",
      boxSizing: "border-box",
      position: "relative",
      display: "inline-block",
      color: "black",
      border: "1px solid #cacaca",
      textAlign: "left",
      verticalAlign: "top",
      fontSize: "14px",
      lineHeight: "15px",
      overflow: "hidden",
      fontFamily: "Calibri, 'Segoe UI', Thonburi,Arial, Verdana, sans-serif",
    };

    if (this.props.x === 0 || this.props.y === 0) {
      css.textAlign = "center";
      css.backgroundColor = "#f0f0f0";
      css.fontWeight = "bold";
    }

    return css;
  };

  shouldComponentUpdate(nextProps, nextState) {
    // Has a formula value? could be affected by any change. Update
    if (this.state.value !== "") {
      return true;
    }

    // Its own state values changed? Update
    // Its own value prop changed? Update
    if (
      nextState.value !== this.state.value ||
      nextState.editing !== this.state.editing ||
      nextState.selected !== this.state.selected ||
      nextProps.value !== this.props.value
    ) {
      console.log("Cell的判断 True");
      return true;
    }

    return false;
  }

  render() {
    const css = this.calculateCss();

    // column 0
    if (this.props.x === 0) {
      return <span style={css}>{this.props.y}</span>;
    }

    // row 0
    if (this.props.y === 0) {
      const alpha = " abcdefghijklmnopqrstuvwxyz".split("");
      return (
        <span
          onKeyPress={this.onKeyPressOnSpan}
          style={css}
          role="presentation"
        >
          {alpha[this.props.x]}
        </span>
      );
    }

    if (this.state.selected) {
      css.outlineColor = "lightblue";
      css.outlineStyle = "dotted";
    }
    if (this.state.currentXy.length > 0 && this.props.x === this.state.currentXy[0] &&
      this.props.y === this.state.currentXy[1]) {
      console.log('cellTyping', this.state.typingName);
      return (
        <>
          <input
            style={css}
            type="text"
            onBlur={this.onBlur}
            onKeyPress={this.onKeyPressOnInput}
            value={this.state.value}
            onChange={this.onChange}
            placeholder={this.state.typingName + '正在编辑'}
            autoFocus
          />
        </>
      );
    }
    if(this.state.currentXy.length<1){
      return (
        <span
        onClick={(e) => this.clicked(e)}
        onDoubleClick={(e) => this.doubleClicked(e)}
        style={css}
        role="presentation"
      >
        {this.display}
      </span>
      );
    }
    return (
      <span
        onClick={(e) => this.clicked(e)}
        onDoubleClick={(e) => this.doubleClicked(e)}
        style={css}
        role="presentation"
      >
        {this.display}
      </span>
    );
  }
}

Cell.propTypes = {
  onChangedValue: PropTypes.func.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  value: PropTypes.string.isRequired,
};
