import React, { Component } from 'react';
import Cell from './Cell.js';

class Board extends Component {
  createBoard(width) {
    const board = [];
    let cellCounter = 0;

    for (let i = 0; i < width; i++) {
      const columns = [];
      for (let j = 0; j < width; j++) {
        columns.push(this.renderCell(cellCounter++));
      }
      board.push(<div key={i} className="board-row">{columns}</div>);
    }
    return board;
  }

  renderCell(i) {
    return <Cell 
      cellClasses={this.props.cellClasses[i]}
      value={this.props.cells[i]} 
      key={i}
      onClick={() => this.props.onClick(i)}
    />;
  }

  render() {
    return (
      <div>{this.createBoard(this.props.width)}</div>
    );
  }
}

export default Board;