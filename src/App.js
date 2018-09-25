import React, { Component } from 'react';
import Board from './components/Board.js';

import './App.css'; 

import 'typeface-roboto';
import { 
  Grid, 
  withStyles,
} from '@material-ui/core';

const styles = theme => ({
  root: {
    flexGrow: 1,
    
  },
});

function shuffle(array) {
  // shuffles an array into random order
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function neighbouringCells(i, width) {
  switch (i) {  // deal with corners first
    case 0: // top left corner
      return [0, 1, 0, 1];
    case width - 1: // top right corner
      return [0, 1, 1, 0];
    case width * (width - 1): // bottom left corner
      return [1, 0, 0, 1];
    case width * width - 1: // bottom right corner
      return [1, 0, 1, 0];
    default:
  }
  if (i < width) {  // top edge
    return [0, 1, 1, 1];
  } else if (width * (width -1) < i && i < width * width) { // bottom edge
    return [1, 0, 1, 1];
  } else if (i % width === 0) { // left edge
    return [1, 1, 0, 1];
  } else if (i % width === width - 1) { // right edge
    return [1, 1, 1, 0];
  } else {                // centre cells
    return [1, 1, 1, 1];
  }
}

function setMines(i, numCells, maxMines) {
  // sets the mines into random places in grid, leaving first clicked cell clear
  // at first entire grid is random, so first clicked cell needs to be cleared later
  var mines = shuffle(Array(numCells).fill(true, 0, maxMines));
  for (let j = 0; j < numCells; j++) {
    if (!mines[j]) {  // set all non-true elements to false
      mines[j] = false
    }
  }
  return clearFirstClickedCell(mines, i);
}

function clearFirstClickedCell(mines, i) {
  // if cell i has a mine, swap it with another that is clear
  var randomCell = Math.floor(Math.random() * (mines.length + 1));
  if (mines[i]) {
    if (!mines[randomCell]) {
      mines[i] = false;
      mines[randomCell] = true;
    } else {
      clearFirstClickedCell(mines, i);
    }
  }
  return mines;
}

function numOfMineNeighbours(mines, width, i, rowsAbove, rowsBelow, columnsLeft, columnsRight) {
  // returns the number of mines in the neighbouring cells to cell i
  var numOfMineNeighbours = 0;
  for (let r = -rowsAbove; r <= rowsBelow; r++) {
    for (let c = -columnsLeft; c <= columnsRight; c++) {
      if (mines[i + (r * width) + c]) {
        numOfMineNeighbours++;
      }
    }
  }
  return numOfMineNeighbours;
}

function setMineProximities(mines, width) {
  var proximities = Array(mines.length);
  for (let i = 0; i < mines.length; i++) {
    if (mines[i]) {
      proximities[i] = "X";
      continue;
    }
    proximities[i] = numOfMineNeighbours(mines, width, i, ...neighbouringCells(i, width));
  }
  return proximities;
}


class App extends Component {
  constructor(props) {
    super(props);

    this.width = 8; // let user change this later
    this.numCells = this.width * this.width;
    this.maxMines = Math.ceil(this.numCells * 0.1); // let user change later

    this.state = {
      cells: Array(this.numCells).fill(null),
      minesLeft: this.maxMines,
      mines: Array(this.numCells).fill(null),
      minesSet: false,
      cellClasses: Array(this.numCells).fill(" cell"),
      mineProximities: Array(this.numCells),
      gameOver: false,
    };
  }

  cellClick(i) {
    if (this.state.cells[i] != null || this.state.cellClasses[i].includes("flag")) { // cell already clicked or a flag
      return;
    }
    var firstProximity = 0;
    var cells = this.state.cells.slice();
    var cellClasses = this.state.cellClasses;
    var mines = this.state.mines;
    var mineProximities = this.state.mineProximities;

    cells[i] = mines[i] ? '!' : mineProximities[i];
    cellClasses[i] += " cellPressed";

    if (!this.state.minesSet) { // set mines if not already set
      mines = setMines(i, this.numCells, this.maxMines);
      mineProximities = setMineProximities(mines, this.width); // set the proximities too
      firstProximity = mineProximities[i];  // set first proximity because setState is slow
      cells[i] = firstProximity;
      cellClasses[i] += " cellPressed";
      for (let j = 0; j < this.numCells; j++) {
        cellClasses[j] += " n" + mineProximities[j];
      }
    }
    if (mines[i]) { // if mine is clicked on
      cellClasses[i] += " cellIsMinePressed";
      for (let j = 0; j < this.numCells; j++) {
        if (mines[j]) {  
          cellClasses[j] += " cellIsMine";
          cells[j] = '!';
        } else {
          cells[j] = mineProximities[j] === 0 ? "" : mineProximities[j];
        }
        if (cellClasses[j].includes("flag")) {
          cellClasses[j] += " flagPressed";
        } 
      }
      this.setState({
        gameOver: true, // end game
      })
    }
    this.setState({
      minesSet: true,
      cells: cells,
      cellClasses,
      mineProximities,
      mines,
    },
    function() {
      if (mineProximities[i] === 0) {
        this.showAdjacentBlankCells(i, this.width, ...neighbouringCells(i, this.width));
      }
    });    
  }

  cellRightClick(i) { // for adding flag to cell
    var e = window.event;
    const classes = this.state.cellClasses;
    const cells = this.state.cells;
    var minesLeft = this.state.minesLeft;

    e.preventDefault();   // stop right click context menu

    if (classes[i].includes("Pressed") || this.state.gameOver) {  // disable flag if already clicked
      return; 
    } else if (classes[i].includes("flag")) {  // toggle flag off
      classes[i] = classes[i].replace(" flag", "");
      cells[i] = null;
      minesLeft++;
    } else {        // toggle flag on
      classes[i] += " flag";
      cells[i] = "⚐";
      minesLeft--;
    }
    this.setState({
      cellClasses: classes,
      minesLeft: minesLeft,
      cells,
    })
  }

  showAdjacentBlankCells(i, width, rowsAbove, rowsBelow, columnsLeft, columnsRight) {
    // sets adjacent blank cells to show when clicked

    const proximities = this.state.mineProximities;
    const classes = this.state.cellClasses;
    const cells = this.state.cells;

    classes[i] += " cellPressed";
    //cells[index] = proximities[index];

    for (let r = -rowsAbove; r <= rowsBelow; r++) {
      for (let c = -columnsLeft; c <= columnsRight; c++) {
        var index = i + (r * width) + c;
        if (proximities[index] === 0) {
          proximities[index] = "";
          this.setState({
            mineProximities: proximities,
            cellClasses: classes,
            cells: cells,
          })
          this.showAdjacentBlankCells(index, width, ...neighbouringCells(index, width));
        }
        classes[index] += " cellPressed";
        cells[index] = proximities[index];
      }
    }
    this.setState({
      mineProximities: proximities,
      cellClasses: classes,
      cells: cells,
    })
  }
  
  resetGame() {
    this.setState({
      cells: Array(this.numCells).fill(null),
      minesLeft: this.maxMines,
      mines: Array(this.numCells).fill(null),
      minesSet: false,
      cellClasses: Array(this.numCells).fill(" cell"),
      mineProximities: Array(this.numCells),
      gameOver: false,
    })
  }

  render() {
    const cells = this.state.cells;
    const resetButtonText = this.state.gameOver ? "You lose!" : "Game in progress";
    const resetButtonClass = this.state.gameOver ? "failedResetButton resetButton cell" : "resetButton cell";
    const { classes } = this.props;
    const cellClasses = this.state.cellClasses;
   
    return (
      <div className="App">
        <header className="App-header">
          <h2 className="App-title">Minesweeper</h2>
        </header>
        <div className={classes.root}>

        <Grid container spacing={24}>
          <Grid item xs>
            <h3></h3>
          </Grid>
          <Grid item xs={6}>
            <div className="game-header">
              <h3>Mines left: {this.state.minesLeft}</h3>
              <button className={resetButtonClass} onClick={() => this.resetGame()}>{resetButtonText}</button>
            </div>
          </Grid>
          <Grid item xs></Grid>
        </Grid>
        </div>

        <Grid container spacing={24}>
          <Grid item xs></Grid>
          <Grid item xs={6}>
            <div className="game-board">
              <Board 
                width={this.width}
                onClick={i => this.cellClick(i)}
                //onContextMenu="javascript:alert('success!');return false;"
                onContextMenu={i => this.cellRightClick(i)}
                cells={cells}
                cellClasses={cellClasses}
              />
            </div>
          </Grid>
          <Grid item xs></Grid>
        </Grid>

        
      </div>
    );   
  }
}

export default withStyles(styles) (App);
