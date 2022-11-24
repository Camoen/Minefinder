const app = new PIXI.Application();
document.body.appendChild(app.view);


const Graphics = PIXI.Graphics;
const squareSize = 15;

function renderMinefield(app, width, height, squareSize){
    let border = 5;
    let boardWidth = width * squareSize;
    let boardHeight = height * squareSize;
    app.renderer.resize(boardWidth + border*2, boardHeight + border*2);
    for (let i = border; i < boardWidth; i += squareSize){
        for (let j = border; j < boardHeight; j += squareSize){
            let square = new Graphics();
            square.beginFill(0x4433AA)
                .lineStyle(1, 0x111111, 0.35)
                .drawRect(i, j, squareSize, squareSize)
                .endFill();
            app.stage.addChild(square);
        }
    }
}

// TODO: Allow user to select mode.
let mode = "expert";
if (mode == "beginner"){
    renderMinefield(app, 9, 9, squareSize);
} else if (mode == "intermediate") {
    renderMinefield(app, 16, 16, squareSize);
} else if (mode == "expert"){
    renderMinefield(app, 30, 16, squareSize);
}

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