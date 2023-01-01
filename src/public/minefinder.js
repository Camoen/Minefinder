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
    loggedIn: false,
    modeSelected: null,
    roomList: [],
    roomName: "",
    roomNameForm: false,
    roomSelected: null,
    username: null,
    usernameForm: false
    },

    created() {
    socket.on('update-room-list', (rooms) => {
        console.log("this has been called with ", rooms);
        this.roomList = rooms;
    });
    },
    methods: {
    createRoom() {
        socket.emit('room-created', this.roomName, this.username);
        console.log('Created room: ', this.roomSelected);
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

// Example of how to use socket from minefinder.js (note that 'socket' var is already defined in index.html)
socket.on('update-room-list', (rooms) => {
    console.log("[socket log from minefinder.js] this has been called with ", rooms);
});
