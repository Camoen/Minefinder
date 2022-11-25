const app = new PIXI.Application();
document.body.appendChild(app.view);
const Graphics = PIXI.Graphics;
const cellSize = 15;


class Cell {
    constructor(app, xCoord, yCoord, cellSize){
        this.value = "E"; // E for EMPTY
        this.square = this.buildCell(app, xCoord, yCoord, cellSize);
    }

    buildCell(app, xCoord, yCoord, cellSize){
        let square = new Graphics();
        square.beginFill(0x4433AA)
            .lineStyle(1, 0x111111, 0.35)
            .drawRect(xCoord, yCoord, cellSize, cellSize)
            .endFill();
        app.stage.addChild(square);
    
        square.interactive = true;
        square.on('mouseenter', function() {
            square.tint = 0x880808;
        })
        square.on('mouseleave', function() {
            square.tint = 0xFFFFFF;
        })
        return square;
    }
}


class Minefield {
    constructor(app, width, height, cellSize, border){
        this.app = app;
        this.board = new Map;
        this.border = border;
        this.cellSize = cellSize;
        this.boardWidth = width * cellSize;
        this.boardHeight = height * cellSize;
        this.createBoard(this.boardWidth, this.boardHeight, this.cellSize, this.border);
    }

    getCellKey(xCoord, yCoord){
        let x = Math.floor((xCoord - this.border) / this.cellSize);
        let y = Math.floor((yCoord - this.border) / this.cellSize);
        return x + "|" +  y;
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

    revealCells(xCoord, yCoord){
        let minX = this.border; 
        let minY = this.border;
        let maxX = this.boardWidth * this.cellSize + this.border;
        let maxY = this.boardHeight * this.cellSize + this.border;
        let step = this.cellSize;
        // We may reveal cells in all 8 directions
        let directions = [[-1, -1], [-1, 0], [-1, 1], 
                          [ 0, -1], [ 0, 1],
                          [ 1, -1], [ 1, 0], [ 1, 1]];

        console.log(this.getCellKey(xCoord, yCoord));
        console.log(this.board.get(this.getCellKey(xCoord, yCoord)).square.vertexData);
        console.log(this.board.get(this.getCellKey(xCoord, yCoord)).value);
        console.log("TODO: Implement DFS :)");

    }
}

let minefield;
// TODO: Allow user to select mode.
let mode = "expert";
if (mode == "beginner"){
    minefield = new Minefield(app, 9, 9, cellSize, 5);
    // minefield = generateMinefield(app, 9, 9, cellSize);
} else if (mode == "intermediate") {
    minefield = new Minefield(app, 16, 16, cellSize, 5);
    // minefield = generateMinefield(app, 16, 16, cellSize);
} else if (mode == "expert"){
    minefield = new Minefield(app, 30, 16, cellSize, 5);
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

// app.stage.addEventListener('click', function handleClick()
// {
//     console.log('Hello world!');
// });

/*
// Begin Tutorial Code
// Magically load the PNG asynchronously
let sprite = PIXI.Sprite.from('sample.png');
app.stage.addChild(sprite);
// Add a variable to count up the seconds our demo has been running
let elapsed = 0.0;
// Tell our application's ticker to run a new callback every frame, passing
// in the amount of time that has passed since the last tick
app.ticker.add((delta) => {
  // Add the time to our total elapsed time
  elapsed += delta;
  // Update the sprite's X position based on the cosine of our elapsed time.  We divide
  // by 50 to slow the animation down a bit...
  sprite.x = 100.0 + Math.cos(elapsed/50.0) * 100.0;
});
// End Tutorial Code
*/