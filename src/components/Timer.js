import React, { Component } from 'react';

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
    }
  }
  
  componentDidMount() {
    this.timer = setInterval(() => {
      if (this.props.timerStatus === "started" && this.state.time < 1000) {
        this.setState({time: (this.state.time + 1)});
      } else if (this.props.timerStatus === "stopped") {
        this.setState({time: this.state.time});
      }
    }, 1000);
  }

  render() {  
    return (
      <h3>Timer: {("00" + this.state.time).slice(-3)}</h3>
    );
  }
}

export default Timer;