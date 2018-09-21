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

function setMines(i, numCells, maxMines) {
  // sets the mines into random places in grid, leaving first clicked cell clear
  // at first entire grid is random, so first clicked cell needs to be cleared later
  var mines = shuffle(Array(numCells).fill(true, 0, maxMines));
  for (let j = 0; j < numCells; j++) {
    if (!mines[j]) {  // set all non-true elements to false
      mines[j] = false
    }
  }
  clearFirstClickedCell(mines, i);
  return mines;
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
}

function setProximity(i, mines, width) {
  var numMinesNear = 0;

  for (let r = -1; r < 2; r++) {
    for (let c = -1; c < 2; c++) {
      //alert("i = " + i + "\nr = " + r + "\nc = " + c + "\n=> " + (i + r * width + c));

      if (i < width) { // first row
        
      }


      if (mines[i + (r * width) + c]) {
        numMinesNear++;
      }
    }
  }
  if (numMinesNear == 0) { return "" }
  return numMinesNear;
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
      cellClasses: Array(this.numCells).fill("cell"),
    };
  }
  
  cellClick(i) {
    if (this.state.minesLeft == 0 || this.state.cells[i]) {
      return;
    }
    if (!this.state.minesSet) {
      this.setState({
        minesSet: true,
        mines: setMines(i, this.numCells, this.maxMines),
      });
    }
    const cells = this.state.cells.slice();
    const mines = this.state.mines;
    const cellClasses = this.state.cellClasses;
    var proximity;

    if (mines[i]) {
      cellClasses[i] += " cellIsMine";
      this.setState({
        minesLeft: this.state.minesLeft - 1,
        cellClasses,
      })
    } else {
      proximity = setProximity(i, mines, this.width);
      
    }
    cells[i] = mines[i] ? '!' : proximity;
    cellClasses[i] += " cellPressed";
    this.setState({
      cells,
      cellClasses,
    });
  }

  resetGame() {
    this.setState({
      cells: Array(this.numCells).fill(null),
      minesLeft: this.maxMines,
      mines: Array(this.numCells).fill(null),
      minesSet: false,
      cellClasses: Array(this.numCells).fill("cell"),
    })
  }

  render() {
    const cells = this.state.cells;
    const resetButtonText = this.state.minesLeft > 0 ? "Game in progress" : "You lose!";
    const resetButtonClass = this.state.minesLeft > 0 ? "resetButton cell" : "failedResetButton resetButton cell";
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
            <h3>Stuff</h3>
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
