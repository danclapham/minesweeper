import React, { Component } from 'react';

class Cell extends Component {
  render() {
    return (
      <button 
        className={this.props.cellClasses} 
        onClick={this.props.onClick}
        onDoubleClick={this.props.onDoubleClick}
        onContextMenu={this.props.onContextMenu}
      >
        {this.props.value}
      </button>
    );
  }
} 

export default Cell;