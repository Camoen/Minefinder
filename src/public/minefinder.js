const app = new PIXI.Application();
document.body.appendChild(app.view);
const Graphics = PIXI.Graphics;
const cellSize = 15;

function createCell(app, xCoord, yCoord, cellSize){
    let cell = new Graphics();
    cell.beginFill(0x4433AA)
        .lineStyle(1, 0x111111, 0.35)
        .drawRect(xCoord, yCoord, cellSize, cellSize)
        .endFill();
    app.stage.addChild(cell);

    cell.interactive = true;
    cell.on('mouseenter', function() {
        cell.tint = 0x880808;
    })
    cell.on('mouseleave', function() {
        cell.tint = 0xFFFFFF;
    })
    return cell
}

function generateMinefield(app, width, height, cellSize){
    let minefield = new Map;
    let border = 5;
    let boardWidth = width * cellSize;
    let boardHeight = height * cellSize;
    app.renderer.resize(boardWidth + border*2, boardHeight + border*2);
    for (let x = border; x < boardWidth; x += cellSize){
        for (let y = border; y < boardHeight; y += cellSize){
            minefield.set(x + "|" +  y, createCell(app, x, y, cellSize));
        }
    }
    return minefield;
}

let minefield;
// TODO: Allow user to select mode.
let mode = "expert";
if (mode == "beginner"){
    minefield = generateMinefield(app, 9, 9, cellSize);
} else if (mode == "intermediate") {
    minefield = generateMinefield(app, 16, 16, cellSize);
} else if (mode == "expert"){
    minefield = generateMinefield(app, 30, 16, cellSize);
}

// Example of how to override tint for a particular cell
minefield.get("5|5").on('mouseenter', function() {
    this.tint = 0x00FF00;
});
minefield.get("5|20").tint = 0xAAAAAA;
minefield.get("20|20").tint = 0xAAAAAA;



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