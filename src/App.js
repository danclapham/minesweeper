import React, { Component } from 'react';
import Board from './components/Board.js';
import Timer from './components/Timer.js';

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
    randomIndex = Math.floor(Math.random() * currentIndex); // selects random index
    currentIndex -= 1;  // moves index back

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;  // swaps elements
  }
  return array;
}

function neighbouringCells(i, width) {
  // returns array of number of rows/columns around clicked cell: [rowsAbove, rowsBelow, columnsLeft, columnsRight]
  //   e.g. a top left corner cell should have rowsAbove = columnsLeft = 0 as they would be outside the grid
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
  // if first clicked cell (element i) has a mine, swap it with another that has no mine
  // the game should never start with a clicked mine leading to game loss
  var randomCell = Math.floor(Math.random() * (mines.length + 1));  // select random cell in grid
  if (mines[i]) {                       // if first clicked cell is a mine, continue
    if (!mines[randomCell]) {           // if random cell is not a mine, swap them
      mines[i] = false;
      mines[randomCell] = true;
    } else {
      clearFirstClickedCell(mines, i);  // else recursively call function again to select a non-mine random cell to swap with
    }
  }
  return mines;
}

function numOfMineNeighbours(mines, width, i, rowsAbove, rowsBelow, columnsLeft, columnsRight) {
  // returns the number of mines in the neighbouring cells to cell i
  var numOfMineNeighbours = 0; // start counter at 0
  for (let r = -rowsAbove; r <= rowsBelow; r++) { // using array returned from neighbouringCells()
    for (let c = -columnsLeft; c <= columnsRight; c++) {
      if (mines[i + (r * width) + c]) { // if a mine, increment counter
        numOfMineNeighbours++;
      }
    }
  }
  return numOfMineNeighbours;
}

function setMineProximities(mines, width) {
  // sets mine proximities in entire grid, called on first click of game
  var proximities = Array(mines.length);
  for (let i = 0; i < mines.length; i++) {
    if (mines[i]) {         // set proximity to 'X' if a mine
      proximities[i] = "X";
      continue;
    }
    // use neighbouringCells() to get rowsAbove, rowsBelow, columnsLeft, columnsRight for use in numOfMineNeighbours()
    proximities[i] = numOfMineNeighbours(mines, width, i, ...neighbouringCells(i, width)); 
  }
  return proximities;
}


class App extends Component {
  constructor(props) {
    super(props);

    this.numCells = 81; // initialise grid to 9x9 with 10 mines

    this.state = {
      width: 9,
      maxMines: 10,
      cells: Array(this.numCells).fill(null), // set clear grid for game start
      minesLeft: 10,
      mines: Array(this.numCells).fill(null),
      minesSet: false,
      cellClasses: Array(this.numCells).fill(" cell"),
      mineProximities: Array(this.numCells),
      gameStatus: "play", // gameStatus = ["play", "win", "lose"]; used for changing button elements and ending the game
      timerStatus: null,
      widthInput: 9,
    };
  }

  cellClick(i) {
    // if cell i is clicked
    if (this.state.cells[i] != null || this.state.cellClasses[i].includes("flag")) { // cell already clicked or a flag
      return;
    } 
    var firstProximity = 0; // used in setting first proximity of game; used because state update can be too slow to set proximities[] in time
    var cells = this.state.cells.slice(); // set various state variables to local ones as states are immutable. will update state later
    var cellClasses = this.state.cellClasses;
    var mines = this.state.mines;
    var mineProximities = this.state.mineProximities;

    cells[i] = mines[i] ? '!' : mineProximities[i]; // set cell to either a '!' for a mine or the proximity number
    cellClasses[i] += " cellPressed";               // change css class to change colour, etc.

    if (!this.state.minesSet) { // set mines if not already set (start of game)
      mines = setMines(i, this.state.width * this.state.width, this.state.maxMines);
      mineProximities = setMineProximities(mines, this.state.width); // set the proximities too
      firstProximity = mineProximities[i];  // set first proximity because setState can be slow to update in time
      cells[i] = firstProximity;
      cellClasses[i] += " cellPressed";
      for (let j = 0; j < this.state.width * this.state.width; j++) {
        cellClasses[j] += " n" + mineProximities[j];  // update css classes so that each proximity number has its own colour
      }
    }
    if (mines[i]) { // if mine is clicked on, end game
      this.setState({
        gameStatus: "lose",
      })
      this.endGame(i, "lose");  // call endGame function
      return;
    }
    this.setState({ // update state with all changes
      timerStatus: "started",
      minesSet: true,
      cells: cells,
      cellClasses,
      mineProximities,
      mines,
      cellsClicked: this.state.cellsClicked + 1,  // used in working out when game is won
    },
    function() {  // this is part of setState so that it's called using the up-to-date state. otherwise may not use latest state
      if (mineProximities[i] === 0) { // if cell has no mine neighbours, search around cell and reveal other blank cells
        this.showNeighbourBlankCells(i, this.state.width, ...neighbouringCells(i, this.state.width));
      }
    });
  }

  cellDoubleClick(i) {
    if (this.state.cells[i] === "" || this.state.cellClasses[i].includes("flag")) { // cell blank or a flag
      return;
    } 
    this.showNeighbourCells(i, this.state.width, ...neighbouringCells(i, this.state.width));
  }

  cellRightClick(i) { 
    // if cell is right-clicked, toggle flag
    var e = window.event;
    const classes = this.state.cellClasses;
    const cells = this.state.cells;
    var minesLeft = this.state.minesLeft;

    e.preventDefault();   // stop right click context menu

    if (classes[i].includes("Pressed") || this.state.gameOver) {  // disable flag-setting if already clicked or game ended
      return; 
    } else if (classes[i].includes("flag")) {  // toggle flag off
      classes[i] = classes[i].replace(" flag", ""); // remove flag from css class
      cells[i] = null;
      minesLeft++;
    } else {        // toggle flag on
      classes[i] += " flag";  // css
      cells[i] = "⚐";
      minesLeft--;
    }
    this.setState({ // update state at end with changes
      cellClasses: classes,
      minesLeft: minesLeft,
      cells,
    })
  }

  showNeighbourBlankCells(i, width, rowsAbove, rowsBelow, columnsLeft, columnsRight) {
    // sets neighbour blank cells to show when clicked, as well as proximities directly around blank block
    const proximities = this.state.mineProximities;
    const classes = this.state.cellClasses;
    const cells = this.state.cells;

    for (let r = -rowsAbove; r <= rowsBelow; r++) {
      for (let c = -columnsLeft; c <= columnsRight; c++) {
        var index = i + (r * width) + c;
        if (proximities[index] === 0) { // if cell next to clicked blank cell also has proximity of 0, change '0' to ''
          proximities[index] = "";
          this.setState({
            mineProximities: proximities,
          })
          // call showNeighbourBlankCells() recursively on neighbour blank cell so that all entire block of blanks is revealed
          this.showNeighbourBlankCells(index, width, ...neighbouringCells(index, width)); 
        }
        if (!classes[index].includes("flag")) { // all non-flag non-blank cells around blank block are also revealed, which cannot be mines
          classes[index] += " cellPressed";
          cells[index] = proximities[index];
        }
      }
    }
    this.setState({ // update state
      mineProximities: proximities,
      cellClasses: classes,
      cells: cells,
    })
  }

  showNeighbourCells(i, width, rowsAbove, rowsBelow, columnsLeft, columnsRight) {
    // shows all neighbouring cells except flags
    var r, c;
    var index;  // initialise
    const cells = this.state.cells.slice();

    for (r = -rowsAbove; r <= rowsBelow; r++) { // loop over neighbour cells
      for (c = -columnsLeft; c <= columnsRight; c++) {
        index = i + (r * width) + c;
        if (this.state.mines[index] && !this.state.cellClasses[index].includes("flag")) { // if there is a mine that isn't flagged, return
          return;
        }
      }
    }
    for (r = -rowsAbove; r <= rowsBelow; r++) {
      for (c = -columnsLeft; c <= columnsRight; c++) {
        index = i + (r * width) + c;
        if (!this.state.cellClasses[index].includes("Pressed") && !this.state.cellClasses[index].includes("flag")) {  // if not pressed or a flag
          this.cellClick(index);  // click that cell
          cells[index] = this.state.mineProximities[index];
          this.setState({ // update state as cellClick state updates too slowly
            cells,  
          })
        }
      }
    }
  }

  endGame(i = this.state.width * this.state.width, gameStatus) {
    // ends the game with either win or lose state
    var cells = this.state.cells.slice();
    var cellClasses = this.state.cellClasses;
    var minesLeft = this.state.minesLeft;

    // if game is ended by clicking on a mine, set mine css to clicked to change colour
    if (i < this.state.width * this.state.width && this.state.mines[i]) {
      cellClasses[i] += " cellIsMinePressed";
    }
    for (let j = 0; j < this.state.width * this.state.width; j++) { // loop through cells in grid
      if (this.state.mines[j] && gameStatus != "win") { // if cell is mine and game was lost, show mine to player
        cellClasses[j] += " cellIsMine";
        cells[j] = '!';
      } else if (this.state.mines[j]) { // if cell is mine and game was won, show as bright green flag if not already flagged, else darker green
        cellClasses[j] += cellClasses[j].includes("flag") ? " flagPressed" : " flag"; // css 
        cells[j] = "⚐";
        minesLeft = 0; // set minesLeft to 0 if game won
      } else { // otherwise show proximities (or '' if 0) so whole grid is revealed
        cells[j] = this.state.mineProximities[j] === 0 ? "" : this.state.mineProximities[j];
      }
    }
    this.setState({ // update state with changes
      cellClasses,
      cells,
      minesLeft,
      timerStatus: "stopped",
    })
  }

  changeWidth(event) {
    var width = event.target.value;
    if (width < 5) { return; }
    this.setState({
      width,
    }, function() {
      this.resetGame()
    })
  }



  changeMaxMines(event) {
    var maxMines = event.target.value;
    if (maxMines > this.state.width * this.state.width - 2) {
      maxMines = this.state.width * this.state.width - 2;
    } 
    this.setState({
      maxMines,
    }, function () {
      this.resetGame(); // reset game to blank state with new size
    })
  }

  decrementMaxMines(dec) {
    // updates state with lower mine number
    var maxMines = Math.max(this.state.maxMines - dec, 1);  // minimum mine number of 1
    this.setState({
      maxMines: maxMines,
      minesLeft: maxMines,
    },
    this.resetGame()) // reset game to blank state with new size
  }

  incrementMaxMines(inc) {
    // updates state with higher mine number
    var maxMines = Math.min(this.state.maxMines + inc, this.state.width * this.state.width - 2);  // max mine number of number of cells - 2
    this.setState({
      maxMines: maxMines,
      minesLeft: maxMines,
    },
    this.resetGame()) // reset game to blank state with new size
  }
  
  resetGame() {
    // sets the game to a blank grid for a new game
    this.setState({
      cells: Array(this.state.width * this.state.width).fill(null),
      minesLeft: this.state.maxMines,
      mines: Array(this.state.width * this.state.width).fill(null),
      minesSet: false,
      cellClasses: Array(this.state.width * this.state.width).fill(" cell"),
      mineProximities: Array(this.state.width * this.state.width),
      gameStatus: "play",
      timerStatus: null,
      widthInput: this.state.width,
    })
  }

  render() {
    // renders game and entire page
    var resetButtonText;  // initialise
    var resetButtonClass;

    switch(this.state.gameStatus) { // change resetButton in accordance with gameState
      case "play":  // if game in progress
        resetButtonText = "Game in progress";   // text in resetButton
        resetButtonClass = "resetButton cell";  // css
        break;
      case "win":   // if game won
        resetButtonText = "You win!";
        resetButtonClass = "greenButton resetButton cell";
        break;
      default:      // if game lost
        resetButtonText = "You lose!";
        resetButtonClass = "redButton resetButton cell";
    }
    var cellsClicked = this.state.cells.filter((item) => item != null).length;  // number of cells that aren't null (which are unclicked)
    var numFlags = this.state.cellClasses.filter((item) => item.includes("flag")).length; // number of flags set in grid

    if (cellsClicked - numFlags === this.state.width * this.state.width - this.state.maxMines && this.state.gameStatus != "win") {  // if game won
      this.setState({
        gameStatus: "win",  // set status to "win"
      },
        this.endGame(this.state.width * this.state.width, "win"), // end the game with win condition
      )
    }
    let timer;
    if (this.state.timerStatus) {
      timer = <Timer timerStatus={this.state.timerStatus}/>;  // if timer started/stopped, show timer
    } else {
      timer = <h3>Timer: 000</h3>;  // else show placeholder
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

                  <form>
                    <label>
                      Width:
                      <input 
                        className="input" 
                        type="number" 
                        value={this.state.width} 
                        min="5" 
                        max="22"
                        pattern="[0-9]*" 
                        inputmode="numeric" 
                        onChange={this.changeWidth.bind(this)} 
                      />
                    </label>
                  </form>
                </div>
                <br></br>
                <div className="option">
                  <form>
                    <label>
                      Mines:
                      <input 
                      className="input" 
                      type="number" 
                      value={this.state.maxMines} 
                      min="1" 
                      max={this.state.width * this.state.width - 2}
                      pattern="[0-9]*" 
                      inputmode="numeric" 
                      onChange={this.changeMaxMines.bind(this)} />
                    </label>
                  </form>
                </div>
              </div>
            </Grid>
            
            <Grid item xs={6}>
              <Grid container spacing={24} className="game-header">
                <Grid item xs={1}></Grid>
                <Grid item xs><h3>Mines left: {this.state.minesLeft}</h3></Grid>
                <Grid item xs={4}><button className={resetButtonClass} onClick={() => this.resetGame()}>{resetButtonText}</button></Grid>
                <Grid item xs>{timer}</Grid> 
                <Grid item xs={1}></Grid>
              </Grid>
              <div className="game-board">
                <Board 
                  width={this.state.width}
                  onClick={i => this.cellClick(i)}
                  onDoubleClick={i => this.cellDoubleClick(i)}
                  onContextMenu={i => this.cellRightClick(i)}
                  cells={cells}
                  cellClasses={cellClasses}
                />
              </div>
            </Grid>

            <Grid item xs></Grid>
          </Grid>
        </div>       
      </div>
    );   
  }
}

export default withStyles(styles) (App);
