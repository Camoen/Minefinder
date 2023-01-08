// Set up game objects
const app = new PIXI.Application();
const Graphics = PIXI.Graphics;
const cellSize = 40;
let border = 5;
let minefield = new Minefield(app, cellSize, border);

// Set up Vue app and handle app logic
const socket = io();
const vuetify = new Vuetify({
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        background: '#5f9ea0',
      },
      dark: {
        background: '#777777',
      },
    },
      dark: false,
  },
});
const vueApp = new Vue({
    el: '#app',
    vuetify: vuetify,

    data: {
    gameModes: ["Individual", "Multiplayer"],
    gameStarted: false,
    loggedIn: false,
    modeSelected: null,
    players: {},
    roomList: [],
    roomName: "",
    roomNameForm: false,
    roomSelected: null,
    username: null,
    usernameForm: false
    },

    computed: {
        /**
         * Build a dictionary of all player statuses in the room.
         * Returned dict includes the following:
         *   1. Player Name (key)
         *   2. Mines remaining
         *   3. Game Status (LOST, WON, or blank to indicate in progress)
         *   4. Time (if player's game status is in a finished state)
         */
        playerStatuses : function () {
            let playerStatuses = {};
            Object.entries(this.players).forEach(([key, value]) => {
                playerStatuses[key] = {};
                playerStatuses[key]["mines"] = value["mines"];
                if ("gameOver" in value && value["gameOver"] == true){
                    playerStatuses[key]["gameOver"] = true;
                    playerStatuses[key]["time"] = value["time"];
                    if (value["gameWon"] === true){
                        playerStatuses[key]["gameWon"] = "WON";
                    } else {
                        playerStatuses[key]["gameWon"] = "LOST";
                    }
                } else {
                    playerStatuses[key]["gameOver"] = false;
                }
            });
            return playerStatuses;
        }
    },

    created() {
    socket.on('update-room-list', (rooms) => {
        console.log("this has been called with ", rooms);
        this.roomList = rooms;
    });

    socket.on('reset-game-board', (mode) => {
        minefield.createNewGame(mode);
        this.gameStarted = true;
        // TODO [Bug Fix]: Ensure synchronicity on game start
        // Currently, there is a bug where if Player A hits "New Game" but then Player B clicks the first square
        // the player boards will be out of sync.
    });

    socket.on('update-game-board', (minePositions) => {
        minefield.placeMines(minePositions);
        this.gameStarted = true;
    });

    socket.on('update-players-in-room', (playersDict) => {
        delete playersDict[this.username];
        this.players = playersDict;
    });
    },
    methods: {
    createRoom() {
        socket.emit('room-created', this.roomName);
        // Automatically join the room upon creation.
        this.selectRoom(this.roomName);
        // TODO [optional]: Don't allow a user to create a custom room, and instead manage room naming automatically
    },

    createUser() {
        this.loggedIn = true;
        socket.emit('user-created', this.username);
        console.log(this);
        // TODO: Allow identical usernames and attach a UUID, otherwise prevent duplicate usernames
            },

    deselectGameMode(){
        this.modeSelected = null;
        if (this.roomSelected !== null){
            this.leaveRoom();
        }
    },

    selectGameMode(mode) {
        this.modeSelected = mode;
        console.log(mode);
    },

    selectRoom(room){
        this.roomSelected = room;
        socket.emit('user-joined-room', this.roomSelected, this.username);
        console.log(this.username, 'joined ', this.roomSelected);
        minefield.createNewGame();
    },

    leaveRoom(){
        socket.emit('user-left-room', this.roomSelected, this.username);
        this.roomSelected = null;
        minefield.createNewGame();
    },

    logOut(){
        // TODO: Remove user from current room, if applicable
        this.loggedIn = false;
        socket.emit('user-deleted', this.username);
    },

    validateRoom(){
        // TODO: Turn roomList into a set for faster lookup.
        return !(this.roomList.includes(this.roomName));
    }
    }
});



// Example of how to override tint for a particular cell
// minefield.board.get(minefield.getCellKey(border + cellSize - 1, border + cellSize - 1)).square.on('mouseenter', function() {
//     this.tint = 0x00FF00;
// });

// Append game container to page and handle game logic
const gameDiv = document.querySelector('#game');
gameDiv.appendChild(app.view);

// On left click, reveal cells on game board
app.stage.on('mouseup', function(mouseData) {
    console.log('X', mouseData.data.global.x, 'Y', mouseData.data.global.y);
    let gameStarted = minefield.routeClick(mouseData.data.global.x, mouseData.data.global.y);
    // If lead player has started the game, emit minefield positions to all players in the room.
    if (gameStarted){
        if (vueApp.roomSelected !== null && !vueApp.gameStarted){
            vueApp.gameStarted = true;
            socket.emit('game-board-created', vueApp.username, vueApp.roomSelected, minefield.minePositions);
        }
    } else {
        if (vueApp.roomSelected !== null && minefield.gameOver){
            // The user is in a room and has either lost or won.
            socket.emit('game-finished',
                        vueApp.username,
                        vueApp.roomSelected, 
                        minefield.gameWon, 
                        minefield.minesRemaining,
                        minefield.header.timer.gameTimerText.text);
        } else if (vueApp.roomSelected !== null && !minefield.gameOver){
            // The user has clicked 'New Game' or selected a new mode.
            socket.emit('game-board-reset', vueApp.username, vueApp.roomSelected, minefield.mode);
        }
        vueApp.gameStarted = false;
    }
});

// On right click, flag a cell
app.stage.on('rightdown', function(mouseData) {
    console.log('X', mouseData.data.global.x, 'Y', mouseData.data.global.y);
    let cellFlagged = minefield.flagCell(mouseData.data.global.x, mouseData.data.global.y);
    if (cellFlagged){
        socket.emit('game-cell-flagged', 
                    vueApp.username, 
                    vueApp.roomSelected, 
                    minefield.mines - minefield.flaggedCells);
    }
});

// Prevent context menu on right click
app.view.addEventListener('contextmenu', (e) => {
    console.log("contextmenu", e)
    e.preventDefault();
});

// Example of how to use socket from minefinder.js (note that 'socket' var is already defined in index.html)
socket.on('update-room-list', (rooms) => {
    console.log("[socket log from minefinder.js] this has been called with ", rooms);
});
