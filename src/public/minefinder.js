const app = new PIXI.Application();
document.body.appendChild(app.view);
const Graphics = PIXI.Graphics;
const cellSize = 40;

class Cell {
    constructor(container, xCoord, yCoord, cellSize){
        this.container = container;
        this.color = 0x4433AA;
        this.defaultColor = 0x4433AA;
        this.cellSize = cellSize;
        this.flagged = false;
        this.revealed = false;
        this.square = new Graphics();
        this.value = "E"; // E for EMPTY
        this.xCoord = xCoord;
        this.yCoord = yCoord;
        this.drawCell();

        this.textStyle = new PIXI.TextStyle({
            fontFamily: "Courier New",
            fontSize: this.cellSize / 2
        });
        this.cellText = new PIXI.Text("", this.textStyle);
        this.cellText.anchor.set(0.5, 0.5);
        this.cellText.x = this.square.width/2;
        this.cellText.y = this.square.height/2;

        this.container.addChild(this.square);
        this.square.addChild(this.cellText);
    }

    drawCell(){
        let square = this.square;
        square.clear();
        square.x = this.xCoord;
        square.y = this.yCoord;
        square.beginFill(this.color)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(0, 0, this.cellSize, this.cellSize)
            .endFill();
    
        square.interactive = true;
        square.on('mouseenter', function() {
            square.tint = 0x880808;
        })
        square.on('mouseleave', function() {
            square.tint = 0xFFFFFF;
        })
        this.square = square;
    }

    /**
     * Toggles a cell's 'flagged' status and updates its display properties.
     */
     toggleFlag(){
        if (this.flagged) {
            this.color = this.defaultColor;
            this.flagged = false;
        } else {
            this.color = 0xFFFF00;
            this.flagged = true;
        }
        this.drawCell();
    }

    /**
     * Takes in a cell's new value, then updates the cell's value and display properties
     * (cell color, text visibility, and text color).
     * 
     * @param {String} value 
     */
    updateCell(value){
        this.value = value;
        this.revealed = true;
        // Only display cell text if a cell has adjacent mines (cell value is numeric)
        if (value.length !== 0 && "12345678".includes(value)){
            this.cellText.text = value;
        }

        switch(this.value){
            case "X":
                this.color = 0xEE4B2B;
                break;
            case "FALSE_FLAG":
                this.color = 0xFFA500;
                break;
            default:
                // Default case also updates the color of revealed cells with no adjacent mines
                this.color = 0xE6E6FA;
                switch(this.value){
                    case "1":
                        this.textStyle.fill = 0x0000ff;
                        break;
                    case "2":
                        this.textStyle.fill = 0x007b00;
                        break;
                    case "3":
                        this.textStyle.fill = 0xfe0000;
                        break;
                    case "4":
                        this.textStyle.fill = 0x09097e;
                        break;
                    case "5":
                        this.textStyle.fill = 0x7b0000;
                        break;
                    case "6":
                        this.textStyle.fill = 0x2a9494;
                        break;
                    case "7":
                        this.textStyle.fill = 0x000000;
                        break;
                    case "8":
                        this.textStyle.fill = 0x808080;
                        break; 
                }
                break; 
        }

        this.drawCell();
    }
}


class MineTracker {
    constructor(container, xCoord, width, height){
        this.container = container;
        this.display = new Graphics();
        this.display.x = xCoord;
        this.display.y = 0;
        this.display.beginFill(0x222222)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(0, 0, width, height)
            .endFill();

        this.textStyle = new PIXI.TextStyle({
            fontFamily: "Courier New",
            fontSize: height * 0.75,
            fill: 0xFF0000
        });
        this.displayText = new PIXI.Text("000", this.textStyle);
        this.displayText.anchor.set(0.5, 0.5);
        this.displayText.x = this.display.width/2;
        this.displayText.y = this.display.height/2;
        
        this.container.addChild(this.display);
        this.display.addChild(this.displayText);
    }

    updateRemainingMines(mines){
        this.displayText.text = mines;
    }
}


class Timer {
    constructor(xCoord, height){
        this.gameTimer = new Graphics();
        this.gameTimer.beginFill(0x222222)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(0, 0, xCoord, height)
            .endFill();
        
        this.gameTimerTextStyle = new PIXI.TextStyle({
            align: "center",
            fontFamily: "Courier New",
            fontSize: height * 0.75,
            fill: 0xFF0000
        });
        this.gameTimerText = new PIXI.Text("0", this.gameTimerTextStyle);
        this.gameTimerText.anchor.set(0.5, 0.5);
        this.gameTimerText.x = this.gameTimer.width/2;
        this.gameTimerText.y = this.gameTimer.height/2;
        this.gameTimer.addChild(this.gameTimerText);
    }

    updateTime(value){
        this.gameTimerText.text = value;
    }

}


class Header {
    constructor(border, width, height){
        this.headerContainer = new PIXI.Container();
        this.headerContainer.x = border;
        this.headerContainer.y = border;
        this.newGameButtonWidth = width / 7;
        this.trackerWidth = width / 7 * 3;
        this.mineTracker = new MineTracker(this.headerContainer, 
                                           this.trackerWidth + this.newGameButtonWidth,
                                           this.trackerWidth, height);
        this.timer = new Timer(this.trackerWidth, height);
        this.headerContainer.addChild(this.timer.gameTimer);
        this.createNewGameButton(height);
    }

    createNewGameButton(height){
        this.newGameButton = new Graphics();
        this.newGameButton.x = this.trackerWidth;
        this.newGameButton.y = 0;
        this.newGameButton.beginFill(0x222222)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(0, 0, this.newGameButtonWidth, height)
            .endFill();

        this.newGameButtonTextStyle = new PIXI.TextStyle({
            align: "center",
            fontFamily: "Courier New",
            fontSize: this.newGameButtonWidth * 0.35,
            fill: 0xFF0000
        });
        this.newGameButtonText = new PIXI.Text("New\nGame", this.newGameButtonTextStyle);
        this.newGameButtonText.anchor.set(0.5, 0.5);
        this.newGameButtonText.x = this.newGameButton.width/2;
        this.newGameButtonText.y = this.newGameButton.height/2;

        this.newGameButton.interactive = true;
        this.newGameButton.on('mouseenter', function() {
            this.tint = 0x90EE90;
        })
        this.newGameButton.on('mouseleave', function() {
            this.tint = 0xFFFFFF;
        })

        this.headerContainer.addChild(this.newGameButton);
        this.newGameButton.addChild(this.newGameButtonText);
    }
}


class Minefield {
    constructor(app, cellSize, border){
        this.app = app;
        this.border = border;
        this.cellSize = cellSize;
        this.mode = "beginner"
        this.headerHeight = cellSize * 2;

        // Game Timer
        this.elapsedSeconds = 0;
        this.previousSecond = 0;
        this.gameTicker = this.createGameTicker();
        this.gameTicker.add(this.updateGameTicker, this);
        
        this.initializeGameVariables(this.mode)
        this.app.renderer.resize(this.boardWidth + border*2, this.boardHeight + this.headerHeight + border*3);
        this.header = new Header(this.border, this.boardWidth, this.headerHeight);
        app.stage.addChild(this.header.headerContainer);
        this.createNewGame();
    }

    initializeGameVariables(){
        if (this.mode == "beginner"){
            this.width = 9;
            this.height = 9;
            this.mines = 10;
        } else if (this.mode == "intermediate") {
            this.width = 16;
            this.height = 16;
            this.mines = 40;
        } else if (this.mode == "expert"){
            this.width = 30;
            this.height = 16;
            this.mines = 99;
        }
        this.mines = Math.min(this.mines, this.width * this.height);
        this.boardWidth = this.width * this.cellSize;
        this.boardHeight = this.height * this.cellSize;
    }

    createNewGame(){
        this.initializeGameVariables();
        this.resetGameTicker();
        this.header.timer.updateTime(0);
        this.createBoard();
    }

    /**
     * Initializes the game board (this.board), which maps coordinates to Cell objects:
     * this.board = {'0|0': Cell(), '15|15': Cell(), ...} 
     * 
     * @param {Number} boardWidth   Number of cells along x-axis of game board
     * @param {Number} boardHeight  Number of cells along y-axis of game board
     * @param {Number} cellSize     Height and Width of one cell
     */
    createBoard() {
        this.boardContainer = new PIXI.Container();
        this.board = new Map;
        this.cellsRemaining = this.width * this.height - this.mines;
        this.flaggedCells = 0;
        this.gameOver = false;
        this.minesPlaced = false;

        for (let x = 0; x < this.width; x += 1){
            for (let y = 0; y < this.height; y += 1){
                this.board.set(this.getCellKeyString(x, y), 
                               new Cell(this.boardContainer, x * this.cellSize, y * this.cellSize, this.cellSize));
            }
        }
        this.boardContainer.x = border;
        this.boardContainer.y = border + this.headerHeight + border;
        this.app.stage.addChild(this.boardContainer);
    }

    /**
     * Must create a new Ticker, since the highest level PIXI.Application has its own ticker.
     * As a result, if we reset ticker via 'app.Ticker.stop()', the app will not render.
     * May be able to refactor later on and rely on the highest level ticker.
     */
    createGameTicker(){
        let ticker = PIXI.Ticker.shared;
        ticker.autoStart = false;
        ticker.stop();
        return ticker;
    }

    /**
     * TODO: Refactor game ticker into separate class if necessary.
     */
    updateGameTicker() {
        this.elapsedSeconds += this.gameTicker.elapsedMS / 1000;
        if (this.elapsedSeconds >= this.previousSecond + 1 ){
            this.previousSecond += 1;
            this.header.timer.updateTime(this.previousSecond);
        }
    }

    resetGameTicker(){
        this.gameTicker.stop();
        this.elapsedSeconds = 0;
        this.previousSecond = 0;
    }


    endGame(win){
        this.gameTicker.stop();
        this.revealMines();
        if (win === true){
            this.header.mineTracker.updateRemainingMines(0);
            alert("You won! :D");
        } else{
            alert("You lost! D:");
        }
    }

    /**
     * Flag a cell as potentially having a mine. A flagged cell cannot be revealed 
     * until it is unflagged.
     * 
     * @param {Number} xCoord 
     * @param {Number} yCoord 
     * @returns 
     */
    flagCell(xCoord, yCoord){
        if (this.gameOver){
            return;
        }        
        let cell = this.board.get(this.getCellKey(xCoord, yCoord));
        if (cell.revealed){
            return;
        }
        cell.toggleFlag();
        // TODO: Use (this.mines - this.flaggedCells) to show potential remaining mines
        if (cell.flagged){
            this.flaggedCells += 1;
        } else {
            this.flaggedCells -= 1;
        }
        this.header.mineTracker.updateRemainingMines(this.mines - this.flaggedCells);
    }

    getCellKeyString(xCoord, yCoord){
        return xCoord + "|" +  yCoord;
    }

    getCellKey(xCoord, yCoord){
        let x = Math.floor((xCoord - this.boardContainer.x) / this.cellSize);
        let y = Math.floor((yCoord - this.boardContainer.y) / this.cellSize);
        return this.getCellKeyString(x, y);
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
                this.board.get(cellKey).value = "M";
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
        this.header.mineTracker.updateRemainingMines(placedMines);
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
        // Could refactor to generate mines when board is created. Then, if first click 
        // happens to be a mine, move the mine to some arbitrary empty cell (if available)
        if (!this.minesPlaced){
            this.placeMines(xCoord, yCoord);
            this.minesPlaced = true;

            if (!this.gameTicker.started){
                this.gameTicker.start();
            }
        }
        let cell = this.board.get(this.getCellKey(xCoord, yCoord));

        // If the cell is flagged or already revealed, do nothing
        if (cell.flagged || !(cell.value == "E" || cell.value == "M")) {
            return;
        }

        // If the cell is a mine, return quickly
        if (cell.value == "M"){
            this.endGame(false);
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
            // Check that the cell isn't flagged or already revealed
            if (cell.flagged || cell.value != "E"){
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
                cell.updateCell("B");
                for (const direction of directions){
                    let i = direction[0] + xCoord;
                    let j = direction[1] + yCoord;
                    // Only travel to cells that aren't out of bounds
                    if ((0 <= i) && (i < this.width) && 
                        (0 <= j) && (j < this.height)){
                        traversalHelper(this.getCellKeyString(i, j));
                    }
                }
            } else {
                cell.updateCell(adjacentMines.toString());
            }
            this.cellsRemaining -= 1;
            if (this.cellsRemaining == 0){
                this.endGame(true);
            }
        }

        traversalHelper(this.getCellKey(xCoord, yCoord));
    }

    /**
     * When a player clicks a mine, reveal all remaining cells.
     */
    revealMines(){
        let cellKeys = Array.from(this.board.keys());
        for (const cellKey of cellKeys){
            let cell = this.board.get(cellKey);
            if (cell.value == "M" && !cell.flagged) {
                cell.updateCell("X");
            } else if (cell.value != "M" && cell.flagged) {
                // Indicate that a cell was falsely flagged by the player
                cell.updateCell("FALSE_FLAG");
            }
        }
        this.gameOver = true;
    }

    /**
     * Route clicks to the gameboard or header depending on click location.
     * @param {*} xCoord 
     * @param {*} yCoord 
     */
    routeClick(xCoord, yCoord){
        if (yCoord < (this.headerHeight + this.border * 2)){
            // TODO: Create a 'Header Click Handler' when more options are introduced.
            // For now, the only interactive button in header is "New Game" button.
            this.createNewGame();
        } else {
            this.revealCells(xCoord, yCoord);
        }
    }
}

let border = 5;
let minefield = new Minefield(app, cellSize, border);

// Example of how to override tint for a particular cell
// minefield.board.get(minefield.getCellKey(border + cellSize - 1, border + cellSize - 1)).square.on('mouseenter', function() {
//     this.tint = 0x00FF00;
// });

// On left click, reveal cells on game board
app.stage.on('mouseup', function(mouseData) {
    console.log('X', mouseData.data.global.x, 'Y', mouseData.data.global.y);
    minefield.routeClick(mouseData.data.global.x, mouseData.data.global.y);
});

// On right click, flag a cell
app.stage.on('rightdown', function(mouseData) {
    console.log('X', mouseData.data.global.x, 'Y', mouseData.data.global.y);
    minefield.flagCell(mouseData.data.global.x, mouseData.data.global.y);
});

// Prevent context menu on right click
app.view.addEventListener('contextmenu', (e) => {
    console.log("contextmenu", e)
    e.preventDefault();
});