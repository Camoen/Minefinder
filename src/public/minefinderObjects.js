class Cell {
    constructor(container, cellKey, xCoord, yCoord, cellSize){
        this.container = container;
        this.color = 0x4433AA;
        this.defaultColor = 0x4433AA;
        this.cellSize = cellSize;
        this.cellKey = cellKey;
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
    constructor(container, xCoord, yCoord, width, height){
        this.container = container;
        this.display = new Graphics();
        this.display.x = xCoord;
        this.display.y = yCoord;
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
    constructor(xCoord, yCoord, width, height){
        this.gameTimer = new Graphics();
        this.gameTimer.x = xCoord;
        this.gameTimer.y = yCoord;
        this.gameTimer.beginFill(0x222222)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(0, 0, width, height)
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
        this.border = border;
        this.headerContainer = new PIXI.Container();
        this.headerContainer.x = border;
        this.headerContainer.y = border;
        this.modeSelectorHeight = height / 5;
        this.trackerHeight = height / 5 * 4;
        this.newGameButtonWidth = width / 7;
        this.trackerWidth = width / 7 * 3;
        this.width = width;
        this.mineTracker = new MineTracker(this.headerContainer, this.trackerWidth + this.newGameButtonWidth,
                                           this.modeSelectorHeight, this.trackerWidth, this.trackerHeight);
        this.timer = new Timer(0, this.modeSelectorHeight, this.trackerWidth, this.trackerHeight);
        this.headerContainer.addChild(this.timer.gameTimer);
        this.createNewGameButton(this.trackerHeight);
        this.createModeSelectionButtons(this.modeSelectorHeight);
    }

    createNewGameButton(height){
        this.newGameButton = new Graphics();
        this.newGameButton.x = this.trackerWidth;
        this.newGameButton.y = this.modeSelectorHeight;
        this.newGameButton.beginFill(0x222222)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(0, 0, this.newGameButtonWidth, height)
            .endFill();

        this.newGameButtonTextStyle = new PIXI.TextStyle({
            align: "center",
            fontFamily: "Courier New",
            fontSize: Math.min(this.newGameButtonWidth * 0.35, 40),
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

    createModeSelectionButtons(height){
        let width = this.width / 3;
        this.beginnerButton = this.createModeButton(0, 0, width, height, "beginner")
        this.intermediateButton = this.createModeButton(width, 0, width, height, "intermediate")
        this.expertButton = this.createModeButton(width*2, 0, width, height, "expert")

        this.headerContainer.addChild(this.beginnerButton);
        this.headerContainer.addChild(this.intermediateButton);
        this.headerContainer.addChild(this.expertButton);

    }

    createModeButton(xCoord, yCoord, width, height, mode){
        let modeButton = new Graphics();
        modeButton.beginFill(0x222222)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(0, 0, width, height)
            .endFill();

        modeButton.x = xCoord;
        modeButton.y = yCoord;
        let modeButtonTextStyle = new PIXI.TextStyle({
            align: "center",
            fontFamily: "Courier New",
            fontSize: height * 0.75,
            fill: 0xFF0000
        });
        let modeButtonText = new PIXI.Text(mode, modeButtonTextStyle);
        modeButtonText.anchor.set(0.5, 0.5);
        modeButtonText.x = width/2;
        modeButtonText.y = height/2;

        modeButton.interactive = true;
        modeButton.on('mouseenter', function() {
            this.tint = 0x90EE90;
        })
        modeButton.on('mouseleave', function() {
            this.tint = 0xFFFFFF;
        })
        // TODO: Ensure that only one mode is lit up at a time (currently, clicking Beginner and then Expert will result in both modes being colored yellow)
        modeButton.on('mouseup', function() {
            modeButton.clear();
            modeButton.beginFill(0xFFA500)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(0, 0, width, height)
            .endFill();
        })

        modeButton.addChild(modeButtonText);
        return modeButton;
    }

    selectMode(modeButton){

    }

    getModeOption(xCoord, yCoord){
        if (yCoord < this.modeSelectorHeight + this.border) {
            if (xCoord < this.width / 3){
                return "beginner"
            } else if (xCoord < this.width / 3 * 2){
                return "intermediate"
            } else {
                return "expert"
            }
        }
    }
}


class Minefield {
    constructor(app, cellSize, border){
        this.app = app;
        this.border = border;
        this.cellSize = cellSize;
        this.currentMode = null;
        this.mode = "beginner"
        this.headerHeight = cellSize * 2.5;

        // Game Timer
        this.elapsedSeconds = 0;
        this.previousSecond = 0;
        this.gameTicker = this.createGameTicker();
        this.gameTicker.add(this.updateGameTicker, this);
        
        this.initializeGame();
        this.createNewGame();
    }

    initializeGame(){
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

        if (this.currentMode != this.mode){
            // Clean up previous board and header, if already created
            this.app.stage.removeChildren();
            this.app.renderer.resize(this.boardWidth + border*2, this.boardHeight + this.headerHeight + border*3);
            this.header = new Header(this.border, this.boardWidth, this.headerHeight);
            this.app.stage.addChild(this.header.headerContainer);
            this.currentMode = this.mode;
        }
    }

    createNewGame(mode){
        this.mode = mode || this.mode;
        this.header.mineTracker.updateRemainingMines(0);
        this.initializeGame();
        this.resetGameTicker();
        this.header.timer.updateTime(0);
        this.header.newGameButtonText.text = "New\nGame";
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
                let cellKey = this.getCellKeyString(x, y);
                this.board.set(cellKey, 
                               new Cell(this.boardContainer, cellKey,
                                        x * this.cellSize, y * this.cellSize, this.cellSize));
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
        this.revealMines(win);
        if (win === true){
            this.header.mineTracker.updateRemainingMines(0);
            this.header.newGameButtonText.text = ":)";
        } else {
            this.header.newGameButtonText.text = ":(";
        }
    }

    /**
     * Flag a cell as potentially having a mine. A flagged cell cannot be revealed 
     * until it is unflagged.
     * 
     * Returns True if a cell is flagged, False otherwise.
     * 
     * @param {Number} xCoord 
     * @param {Number} yCoord 
     * @returns 
     */
    flagCell(xCoord, yCoord){
        if (this.gameOver){
            return false;
        }        
        let cell = this.board.get(this.getCellKey(xCoord, yCoord));
        if (cell.revealed){
            return false;
        }
        cell.toggleFlag();
        if (cell.flagged){
            this.flaggedCells += 1;
        } else {
            this.flaggedCells -= 1;
        }
        this.header.mineTracker.updateRemainingMines(this.mines - this.flaggedCells);
        return true;
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
    createMines(xCoord, yCoord){
        let placedMines = 0;
        let cellKeys = Array.from(this.board.keys());
        // Track mine positions to export to other players in the same room.
        this.minePositions = {};
        // Handle edge case where all cells are mines
        if (this.mines == cellKeys.length){
            for (const cellKey of cellKeys){
                this.board.get(cellKey).value = "M";
            }
        } else {
            let safePosition = this.getCellKey(xCoord, yCoord);
            this.minePositions["safe"] = safePosition;
            this.minePositions["mines"] = [];
            cellKeys.splice(cellKeys.indexOf(safePosition), 1);
            while (placedMines < this.mines){
                let cellKeyIndex = Math.floor(Math.random() * cellKeys.length);
                let cellKey = cellKeys[cellKeyIndex];
                this.board.get(cellKey).value = "M";
                this.minePositions["mines"].push(cellKey);
                cellKeys.splice(cellKeyIndex, 1);
                placedMines += 1;
            }
        }
        this.header.mineTracker.updateRemainingMines(placedMines);
    }

    /**
     * In multiplayer modes, this function is used to update the player's board to match
     * the lead player. Takes in a map containing the following:
     *   "safe": cell key for the guaranteed safe cell (in format '0|3')
     *   "mines": an array of cells with mines (in format ['0|2', '3|5', ...])
     * 
     * @param {Map} minePositions 
     */
    placeMines(minePositions){
        // Set value for all cells that should have mines
        for (var i = 0; i < minePositions["mines"].length; i++){ 
            this.board.get(minePositions["mines"][i]).value = "M";
        }
        // Start game timer and reveal cells starting from the location selected by the lead player
        this.minesPlaced = true;
        this.header.mineTracker.updateRemainingMines(minePositions["mines"].length);
        this.gameTicker.start();
        this.revealCells(this.board.get(minePositions["safe"]));
    }

    /**
     * Traverse the board and recursively reveal all adjacent cells that are blank.
     * Starts at a position specified by coordinates.
     * 
     * @param {Number} xCoord 
     * @param {Number} yCoord 
     * @returns 
     */
    revealCellsFromCoordinates(xCoord, yCoord){
        if (this.gameOver){
            return;
        }
        // Could refactor to generate mines when board is created. Then, if first click 
        // happens to be a mine, move the mine to some arbitrary empty cell (if available)
        if (!this.minesPlaced){
            this.createMines(xCoord, yCoord);
            this.minesPlaced = true;

            if (!this.gameTicker.started){
                this.gameTicker.start();
            }
        }
        let cell = this.board.get(this.getCellKey(xCoord, yCoord));
        this.revealCells(cell);
    }

    /**
     * Traverse the board and recursively reveal all adjacent cells that are blank.
     * Starts from a specified cell.
     * 
     * @param {*} cell 
     * @returns 
     */
    revealCells(cell){
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

        traversalHelper(cell.cellKey);
    }

    /**
     * When a player clicks a mine, reveal all remaining cells.
     */
    revealMines(win){
        let cellKeys = Array.from(this.board.keys());
        for (const cellKey of cellKeys){
            let cell = this.board.get(cellKey);
            if (win){
                // Mark all mines with flags if game is won
                if (cell.value == "M" && !cell.flagged) {
                    cell.toggleFlag();
                }
            } else {
                if (cell.value == "M" && !cell.flagged) {
                    cell.updateCell("X");
                } else if (cell.value != "M" && cell.flagged) {
                    // Indicate that a cell was falsely flagged by the player
                    cell.updateCell("FALSE_FLAG");
                }
            }
        }
        this.gameOver = true;
    }

    /**
     * Route clicks to the gameboard or header depending on click location.
     * Returns if game is started or not.
     * 
     * @param {*} xCoord 
     * @param {*} yCoord 
     */
    routeClick(xCoord, yCoord){
        if (yCoord < (this.headerHeight + this.border * 2)){
            let mode = this.header.getModeOption(xCoord, yCoord);
            if (mode != null){
                this.mode = mode
            }
            this.createNewGame();
        } else {
            this.revealCellsFromCoordinates(xCoord, yCoord);
        }
        return this.gameTicker.started;
    }
}
