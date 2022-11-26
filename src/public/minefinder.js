const app = new PIXI.Application();
document.body.appendChild(app.view);
const Graphics = PIXI.Graphics;
const cellSize = 15;


class Cell {
    constructor(app, xCoord, yCoord, cellSize){
        this.app = app;
        this.color = 0x4433AA;
        this.cellSize = cellSize;
        this.square;
        this.value = "E"; // E for EMPTY
        this.xCoord = xCoord;
        this.yCoord = yCoord;
        this.drawCell();
    }

    drawCell(){
        let square = new Graphics();
        square.beginFill(this.color)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(this.xCoord, this.yCoord, this.cellSize, this.cellSize)
            .endFill();
        this.app.stage.addChild(square);
    
        square.interactive = true;
        square.on('mouseenter', function() {
            square.tint = 0x880808;
        })
        square.on('mouseleave', function() {
            square.tint = 0xFFFFFF;
        })
        this.square = square;
    }
}


class Minefield {
    constructor(app, width, height, mines, cellSize, border){
        this.app = app;
        this.board = new Map;
        this.border = border;
        this.cellSize = cellSize;
        this.gameOver = false;
        this.height = height;
        this.mines = mines;
        this.minesPlaced = false;
        this.boardWidth = width * cellSize;
        this.boardHeight = height * cellSize;
        this.width = width;
        this.createBoard(this.boardWidth, this.boardHeight, this.cellSize, this.border);
    }

    getCellKeyString(xCoord, yCoord){
        return xCoord + "|" +  yCoord;
    }

    getCellKey(xCoord, yCoord){
        let x = Math.floor((xCoord - this.border) / this.cellSize);
        let y = Math.floor((yCoord - this.border) / this.cellSize);
        return this.getCellKeyString(x, y);
    }

    /**
     * Initializes the game board (this.board), which maps coordinates to Cell objects:
     * this.board = {'0|0': Cell(), '15|15': Cell(), ...} 
     * 
     * @param {Number} boardWidth   Number of cells along x-axis of game board
     * @param {Number} boardHeight  Number of cells along y-axis of game board
     * @param {Number} cellSize     Height and Width of one cell
     * @param {Number} border       Offset to provide a border around the game board
     */
    createBoard(boardWidth, boardHeight, cellSize, border) {
        this.app.renderer.resize(boardWidth + border*2, boardHeight + border*2);
        for (let x = border; x < boardWidth; x += cellSize){
            for (let y = border; y < boardHeight; y += cellSize){
                this.board.set(this.getCellKey(x, y), new Cell(this.app, x, y, cellSize));
            }
        }
    }

    /**
     * Only place mines after the player's first click. A player should never lose on
     * the first turn, unless the entire board is filled with mines.
     * 
     * @param {Number} xCoord 
     * @param {Number} yCoord 
     * @returns
     */
    placeMines(xCoord, yCoord){
        let placedMines = 0;
        let cellKeys = Array.from(this.board.keys());
        // Handle edge case where all cells are mines
        if (this.mines == cellKeys.length){
            for (const cellKey of cellKeys){
                this.board.get(cellKey).value == "M";
            }
        } else {
            let safePosition = this.getCellKey(xCoord, yCoord);
            cellKeys.splice(cellKeys.indexOf(safePosition), 1);
            while (placedMines < this.mines){
                let cellKeyIndex = Math.floor(Math.random() * cellKeys.length);
                let cellKey = cellKeys[cellKeyIndex];
                if (this.board.get(cellKey).value == "E") {
                    this.board.get(cellKey).value = "M";
                    cellKeys.splice(cellKeyIndex, 1);
                    placedMines += 1;
                }
            }
        }
    }

    /**
     * When a player clicks a mine, reveal all remaining cells.
     */
    revealMines(){
        let cellKeys = Array.from(this.board.keys());
        for (const cellKey of cellKeys){
            let cell = this.board.get(cellKey);
            if (cell.value == "M") {
                cell.color = 0xEE4B2B;
                cell.drawCell();
            }
        }
    }

    /**
     * Traverse the board and recursively reveal all adjacent cells that are blank.
     * 
     * @param {Number} xCoord 
     * @param {Number} yCoord 
     * @returns 
     */
    revealCells(xCoord, yCoord){
        if (this.gameOver){
            return;
        }
        if (!this.minesPlaced){
            this.placeMines(xCoord, yCoord);
            this.minesPlaced = true;
        }
        let cell = this.board.get(this.getCellKey(xCoord, yCoord));

        // If the cell is already revealed, do nothing
        if (!(cell.value == "E" || cell.value == "M")) {
            return;
        }

        // If the cell is a mine, return quickly
        if (cell.value == "M"){
            this.revealMines();
            cell.value = "X";
            this.gameOver = true;
            return;
        }

        let directions = [[-1, -1], [-1, 0], [-1, 1], 
                          [ 0, -1], [ 0, 1],
                          [ 1, -1], [ 1, 0], [ 1, 1]];


        // Use an arrow function to retain the 'this' value of the current context
        const traversalHelper = (cellKey) => {
            let coords = cellKey.split("|");
            let xCoord = Number(coords[0]);
            let yCoord = Number(coords[1]);
            console.log(cellKey, coords, xCoord, yCoord);
            let cell = this.board.get(cellKey);
            // Check that the cell hasn't already been revealed
            if (cell.value != "E"){
                return;
            }
            // Calculate number of adjacent mines
            let adjacentMines = 0;
            for (const direction of directions){
                let i = direction[0] + xCoord;
                let j = direction[1] + yCoord;
                // Check adjacent cells only if they're not out of bounds
                if ((0 <= i) && (i < this.width) && 
                    (0 <= j) && (j < this.height) &&
                    this.board.get(this.getCellKeyString(i, j)).value == "M"){
                    adjacentMines += 1;
                }
            }
            console.log("adjMines: ", adjacentMines);
            // Set the revealed cell's new value
            if (adjacentMines == 0){
                cell.value = "B";
                for (const direction of directions){
                    let i = direction[0] + xCoord;
                    let j = direction[1] + yCoord;
                    // Only travel to cells that aren't out of bounds
                    if ((0 <= i) && (i < this.width) && 
                        (0 <= j) && (j < this.height)){
                        cell.color = 0xE6E6FA;
                        cell.drawCell();
                        traversalHelper(this.getCellKeyString(i, j));
                    }
                }
            } else {
                cell.value = adjacentMines.toString();
                cell.color = 0xFFFF00;
                cell.drawCell();
            }
        }

        traversalHelper(this.getCellKey(xCoord, yCoord));
    }
}

let minefield;
// TODO: Allow user to select mode.
let mode = "expert";
if (mode == "beginner"){
    minefield = new Minefield(app, 9, 9, 10, cellSize, 5);
    // minefield = generateMinefield(app, 9, 9, cellSize);
} else if (mode == "intermediate") {
    minefield = new Minefield(app, 16, 16, 40, cellSize, 5);
    // minefield = generateMinefield(app, 16, 16, cellSize);
} else if (mode == "expert"){
    minefield = new Minefield(app, 30, 16, 99, cellSize, 5);
    // minefield = generateMinefield(app, 30, 16, cellSize);
}

// Example of how to override tint for a particular cell
minefield.board.get(minefield.getCellKey(5, 5)).square.on('mouseenter', function() {
    this.tint = 0x00FF00;
});

// On click, reveal cells on game board
app.stage.on('pointerup', function(mouseData) {
    console.log('X', mouseData.data.global.x, 'Y', mouseData.data.global.y);
    minefield.revealCells(mouseData.data.global.x, mouseData.data.global.y);
});

