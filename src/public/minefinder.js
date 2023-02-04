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
    userIsLeader: false,
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
         *   5. Whether or not the player is the room leader
         */
        playerStatuses : function () {
            let playerStatuses = {};
            Object.entries(this.players).forEach(([key, value]) => {
                playerStatuses[key] = {};
                playerStatuses[key]["mines"] = value["mines"];
                if ("gameOver" in value && value["gameOver"] == true){
                    playerStatuses[key]["gameOver"] = true;
                    playerStatuses[key]["time"] = value["time"];
                    if ("overallWinner" in value){
                        if (value["overallWinner"] == true){
                            playerStatuses[key]["gameWon"] = "WON";
                        } else {
                            playerStatuses[key]["gameWon"] = "LOST";
                        }
                    } else {
                        if (value["gameWon"] === true){
                            playerStatuses[key]["gameWon"] = "WON";
                        } else {
                            playerStatuses[key]["gameWon"] = "LOST";
                        }
                    }
                } else {
                    playerStatuses[key]["gameOver"] = false;
                }
                if ("leader" in value && value["leader"] == true){
                    playerStatuses[key]["leader"] = true;
                } else {
                    playerStatuses[key]["leader"] = false;
                }
            });
            console.log("playserStatus: ", playerStatuses);
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
        this.gameStarted = false;
    });

    socket.on('set-user-as-leader', () => {
        this.userIsLeader = true;
    });

    socket.on('update-game-board', (minePositions) => {
        minefield.placeMines(minePositions);
        this.gameStarted = true;
    });

    socket.on('update-players-in-room', (playersDict) => {
        let playerName = this.username + " (you)";
        playersDict[playerName] = playersDict[this.username];
        delete playersDict[this.username];
        this.players = playersDict;
    });
    },
    methods: {
    createRoom() {
        socket.emit('room-created', this.roomName);
        // Flag current player as leader
        this.userIsLeader = true;
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
        // TODO: If someone joins a room after a game is already in progress, it can lead to unintended behaviors.
        this.roomSelected = room;
        socket.emit('user-joined-room', this.roomSelected, this.username);
        console.log(this.username, 'joined ', this.roomSelected);
        minefield.createNewGame();
    },

    leaveRoom(){
        socket.emit('user-left-room', this.roomSelected, this.username);
        this.userIsLeader = false;
        this.roomSelected = null;
        minefield.createNewGame();
    },

    logOut(){
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
    // User may start or reset a game if (1) they're in individual mode or (2) they're the room leader
    let userMayControlGame = false;
    if (vueApp.roomSelected == null || vueApp.userIsLeader == true){
        userMayControlGame = true;
    }
    if (!userMayControlGame && !minefield.gameOver){
        minefield.header.newGameButtonText.text = ":O";
    }
    if (userMayControlGame || vueApp.gameStarted){
        let gameStarted = minefield.routeClick(mouseData.data.global.x, mouseData.data.global.y, userMayControlGame);
        // If lead player has started the game, emit minefield positions to all players in the room.
        if (gameStarted){
            if (vueApp.roomSelected !== null && !vueApp.gameStarted){
                socket.emit('game-board-created', vueApp.username, vueApp.roomSelected, minefield.minePositions);
            }
            vueApp.gameStarted = true; // Must start the game also for 'individual' players
        } else {
            if (vueApp.roomSelected !== null && minefield.gameOver){
                // The user is in a room and has either lost or won, emit their status to all other players.
                socket.emit('game-finished',
                            vueApp.username,
                            vueApp.roomSelected, 
                            minefield.gameWon, 
                            minefield.minesRemaining,
                            minefield.header.timer.gameTimerText.text);
                // TODO: Determine a winner (or top performer) via following criteria: LEAST MINES REMAINING, then SHORTEST TIME
            } else if (vueApp.roomSelected !== null && !minefield.gameOver){
                // The leader has clicked 'New Game' or selected a new mode.
                socket.emit('game-board-reset', vueApp.username, vueApp.roomSelected, minefield.mode);
            }
            vueApp.gameStarted = false;
        }
    }
});

// On right click, flag a cell
app.stage.on('rightdown', function(mouseData) {
    if (vueApp.gameStarted){
        console.log('X', mouseData.data.global.x, 'Y', mouseData.data.global.y);
        let cellFlagged = minefield.flagCell(mouseData.data.global.x, mouseData.data.global.y);
        if (vueApp.roomSelected !== null && cellFlagged){
            socket.emit('game-cell-flagged', 
                        vueApp.username, 
                        vueApp.roomSelected, 
                        minefield.mines - minefield.flaggedCells);
        }
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
