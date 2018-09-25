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

    this.numCells = 81;

    this.state = {
      width: 9,
      maxMines: 10,
      cells: Array(this.numCells).fill(null),
      minesLeft: 10,
      mines: Array(this.numCells).fill(null),
      minesSet: false,
      cellClasses: Array(this.numCells).fill(" cell"),
      mineProximities: Array(this.numCells),
      gameStatus: "play",
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
      mines = setMines(i, this.state.width * this.state.width, this.state.maxMines);
      mineProximities = setMineProximities(mines, this.state.width); // set the proximities too
      firstProximity = mineProximities[i];  // set first proximity because setState is slow
      cells[i] = firstProximity;
      cellClasses[i] += " cellPressed";
      for (let j = 0; j < this.state.width * this.state.width; j++) {
        cellClasses[j] += " n" + mineProximities[j];
      }
    }
    if (mines[i]) { // if mine is clicked on, end game
      this.setState({
        gameStatus: "lose",
      })
      this.endGame(i, "lose");
      return;
    }
    this.setState({
      minesSet: true,
      cells: cells,
      cellClasses,
      mineProximities,
      mines,
      cellsClicked: this.state.cellsClicked + 1,
    },
    function() {
      if (mineProximities[i] === 0) {
        this.showAdjacentBlankCells(i, this.state.width, ...neighbouringCells(i, this.state.width));
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

    for (let r = -rowsAbove; r <= rowsBelow; r++) {
      for (let c = -columnsLeft; c <= columnsRight; c++) {
        var index = i + (r * width) + c;
        if (proximities[index] === 0) {//} && !classes[index].includes("flag")) {
          proximities[index] = "";
          this.setState({
            mineProximities: proximities,
          })
          this.showAdjacentBlankCells(index, width, ...neighbouringCells(index, width));
        }
        if (!classes[index].includes("flag")) {
          classes[index] += " cellPressed";
          cells[index] = proximities[index];
        }
      }
    }
    this.setState({
      mineProximities: proximities,
      cellClasses: classes,
      cells: cells,
    })
  }

  endGame(i = this.state.width * this.state.width, gameStatus) {
    var cells = this.state.cells.slice();
    var cellClasses = this.state.cellClasses;

    if (i < this.state.width * this.state.width && this.state.mines[i]) {
      cellClasses[i] += " cellIsMinePressed";
    }
    for (let j = 0; j < this.state.width * this.state.width; j++) {
      if (this.state.mines[j] && gameStatus != "win") {
        cellClasses[j] += " cellIsMine";
        cells[j] = '!';
      } else if (this.state.mines[j]) {
        cellClasses[j] += cellClasses[j].includes("flag") ? " flagPressed" : " flag";
        cells[j] = "⚐";
      } else {
        cells[j] = this.state.mineProximities[j] === 0 ? "" : this.state.mineProximities[j];
      }
    }
    this.setState({
      cellClasses,
      cells,
    })
  }

  decrementWidth(dec) {
    var width = Math.max(this.state.width - dec, 1);
    var maxMines = this.state.maxMines;
    if (maxMines > width * width - 2) {
      maxMines = width * width - 2;
    }
    this.setState({
      width,
      maxMines,
    },
    function () {
      this.resetGame()
    })
  }

  incrementWidth(inc) {
    this.setState({
      width: Math.min(this.state.width + inc, 22),
      cells: Array(this.state.width * this.state.width).fill(null),
      cellClasses: Array(this.state.width * this.state.width).fill(" cell"),
    },
    function () {
      this.resetGame();
    })
  }

  decrementMaxMines(dec) {
    var maxMines = Math.max(this.state.maxMines - dec, 1);
    this.setState({
      maxMines: maxMines,
      minesLeft: maxMines,
    },
    this.resetGame())
  }

  incrementMaxMines(inc) {
    var maxMines = Math.min(this.state.maxMines + inc, this.state.width * this.state.width - 2);
    this.setState({
      maxMines: maxMines,
      minesLeft: maxMines,
    },
    this.resetGame())
  }
  
  resetGame() {
    this.setState({
      cells: Array(this.state.width * this.state.width).fill(null),
      minesLeft: this.state.maxMines,
      mines: Array(this.state.width * this.state.width).fill(null),
      minesSet: false,
      cellClasses: Array(this.state.width * this.state.width).fill(" cell"),
      mineProximities: Array(this.state.width * this.state.width),
      gameStatus: "play",
    })
  }

  render() {
    var resetButtonText;
    var resetButtonClass;

    switch(this.state.gameStatus) {
      case "play":
        resetButtonText = "Game in progress";
        resetButtonClass = "resetButton cell";
        break;
      case "win":
        resetButtonText = "You win!";
        resetButtonClass = "successResetButton resetButton cell";
        break;
      default:
        resetButtonText = "You lose!";
        resetButtonClass = "failedResetButton resetButton cell";
    }
    var cellsClicked = this.state.cells.filter((item) => item != null).length;
    var numFlags = this.state.cellClasses.filter((item) => item.includes("flag")).length;

    if (cellsClicked - numFlags === this.state.width * this.state.width - this.state.maxMines && this.state.gameStatus != "win") {  // if game won
      this.setState({
        gameStatus: "win",
      },
        this.endGame(this.state.width * this.state.width, "win"),
      )
    }    
    const { classes } = this.props;
    const cells = this.state.cells;
    const cellClasses = this.state.cellClasses;

    return (
      <div className="App">
        <header className="App-header">
          <h2 className="App-title">Minesweeper</h2>
        </header>
        <div className={classes.root}>

          <Grid container spacing={24}>
            <Grid item xs>
              <div className="options-panel">
                <h2 className="options-title">Options</h2>
                <div className="option">
                  <h3 className="option-title">Width:  </h3>
                  <button 
                    className="options-button" 
                    onClick={() => this.decrementWidth(1)}
                  >-</button>
                  <b> {this.state.width} </b>
                  <button 
                    className="options-button" 
                    onClick={() => this.incrementWidth(1)}
                  >+</button>
                </div>
                <br></br>
                <div className="option">
                  <h3 className="option-title">Mines:</h3>
                  <button className="options-button" onClick={() => this.decrementMaxMines(1)}>-</button>
                  <b> {this.state.maxMines} </b>
                  <button className="options-button" onClick={() => this.incrementMaxMines(1)}>+</button>
                </div>
              </div>
            </Grid>
            
            <Grid item xs={4}>
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
                width={this.state.width}
                onClick={i => this.cellClick(i)}
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
