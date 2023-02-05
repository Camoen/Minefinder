const http = require('http');
const express = require('express');
const path = require('path')
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const socketio = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var usernames = {};
var rooms = {};


function getUsersInRoom(roomName){
  return Object.keys(rooms[roomName]["users"]);
}

function setWinnerInRoom(roomName){
  let usersInRoom = getUsersInRoom(roomName);
  let winner = null;
  let winnerMines = Number.POSITIVE_INFINITY;
  let winnerTime = Number.POSITIVE_INFINITY;
  let tiedWinners = new Set();
  let losers = new Set();

  for (var i = 0; i < usersInRoom.length; i++){ 
    let curUser = usersInRoom[i];
    let curUserVal = rooms[roomName]["users"][usersInRoom[i]];
    if (curUserVal["mines"] == winnerMines && curUserVal["time"] == winnerTime){
      tiedWinners.add(curUser);
    } else if (curUserVal["mines"] < winnerMines || (curUserVal["mines"] == winnerMines && curUserVal["time"] < winnerTime)){
      // If a user (1) has less mines remaining or (2) has the same number of mines but took less time, they win.
      losers = new Set([...losers, ...tiedWinners]);
      tiedWinners.clear();
      winner = curUser;
      winnerMines = curUserVal["mines"];
      winnerTime = curUserVal["time"];
      tiedWinners.add(curUser);
    } else {
      losers.add(curUser);
    }
  }

  tiedWinners.forEach((user) => {
    rooms[roomName]["users"][user]["overallWinner"] = true;
  })
  losers.forEach((user) => {
    rooms[roomName]["users"][user]["overallWinner"] = false;
  })

  for (var j = 0; j < usersInRoom.length; j++){ 
    socketio.to(usernames[usersInRoom[j]]).emit('update-players-in-room', rooms[roomName]["users"]);
  }
}

function updateAllPlayerStatusesInRoom(roomName){
  let usersInRoom = getUsersInRoom(roomName);
  let finishedGames = 0;
  for (var i = 0; i < usersInRoom.length; i++){ 
    socketio.to(usernames[usersInRoom[i]]).emit('update-players-in-room', rooms[roomName]["users"]);

    // Track if each user has finished the game
    let curUser = rooms[roomName]["users"][usersInRoom[i]];
    if ("gameOver" in curUser && curUser["gameOver"] == true){
      finishedGames += 1;
    }
  }
  // If the game is over, decide the winner
  if (finishedGames == usersInRoom.length){
    setWinnerInRoom(roomName);
  } 
}

socketio.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log(socket.username, ' disconnected');
    delete usernames[socket.username];
  });

  socket.on('room-created', (roomName)=>{
		rooms[roomName] = {};
    rooms[roomName]["users"] = {};
    rooms[roomName]["leader"] = null;
    socketio.emit('update-room-list',  Object.keys(rooms));
		console.log("Rooms: ", rooms);
	});

  socket.on('game-board-created', (username, roomName, minePositions)=>{
    // Get all users in the room, then send minePositions to each user's socket
    let usersInRoom = getUsersInRoom(roomName);
    for (var i = 0; i < usersInRoom.length; i++){ 
      rooms[roomName]["users"][usersInRoom[i]]["mines"] = minePositions["mines"].length;
      if (usersInRoom[i] != username){
        socketio.to(usernames[usersInRoom[i]]).emit('update-game-board', minePositions);
      }
    }
    updateAllPlayerStatusesInRoom(roomName);
    rooms[roomName]["gameStarted"] = true;
	});

  socket.on('game-board-reset', (username, roomName, mode)=>{
    // Get all users in the room, then reset all boards
    let usersInRoom = getUsersInRoom(roomName);
    for (var i = 0; i < usersInRoom.length; i++){ 
      // Reset game status for all users, but maintain leader status
      let userLeaderStatus = rooms[roomName]["users"][usersInRoom[i]]["leader"];
      rooms[roomName]["users"][usersInRoom[i]] = {};
      rooms[roomName]["users"][usersInRoom[i]]["mines"] = 0;
      rooms[roomName]["users"][usersInRoom[i]]["leader"] = userLeaderStatus;

      // Reset board for all users except lead player (already has reset board)
      if (usersInRoom[i] != username){
        socketio.to(usernames[usersInRoom[i]]).emit('reset-game-board', mode);
      }
      // TODO [Optional]: Can be more efficient by resetting all player mine counts to 0 on client side when game is reset
      updateAllPlayerStatusesInRoom(roomName);
      rooms[roomName]["gameStarted"] = false;
    }
	});

  socket.on('game-cell-flagged', (username, roomName, minesRemaining)=>{
    rooms[roomName]["users"][username]["mines"] = minesRemaining;
    updateAllPlayerStatusesInRoom(roomName);
  });

  socket.on('game-finished', (username, roomName, gameWon, minesRemaining, time)=>{
    rooms[roomName]["users"][username]["gameOver"] = true;
    rooms[roomName]["users"][username]["gameWon"] = gameWon;
    rooms[roomName]["users"][username]["mines"] = minesRemaining;
    rooms[roomName]["users"][username]["time"] = time;
    updateAllPlayerStatusesInRoom(roomName);
  });

  socket.on('user-created', (username)=>{
		socket.username = username;
		usernames[username] = socket.id;
    socketio.to(socket.id).emit('update-room-list',  Object.keys(rooms));
    console.log("rooms: ", rooms);
		console.log("Users: ", usernames);
	});

  socket.on('user-deleted', (username)=>{
		delete usernames[socket.username];
		console.log("Users: ", usernames);
	});

  socket.on('user-joined-room', (roomName, username)=>{
    // Init a dictionary to track user-level data in the room
    // rooms = []
    // rooms[roomName] = dictionary that maps roomName to room details
    // rooms[roomName]["users"] = dictionary that holds user state dictionaries
    // rooms[roomName]["users"][username] = dictionary that maps Username -> User Details
		rooms[roomName]["users"][username] = {};
    // If this is the only player in the room, set the player as leader.
    if (rooms[roomName]["leader"] == null){
      rooms[roomName]["leader"] = username;
      rooms[roomName]["users"][username]["leader"] = true;
    } else {
      rooms[roomName]["users"][username]["leader"] = false;
    }
		console.log("Rooms: ", rooms);
    // Players joining an in progress game must wait until the next round to join in.
    if (rooms[roomName]["gameStarted"] == true){
      rooms[roomName]["users"][username]["gameOver"] = true;
      rooms[roomName]["users"][username]["gameOver"] = false;
    }
    updateAllPlayerStatusesInRoom(roomName);
	});

  socket.on('user-left-room', (roomName, username)=>{
		delete rooms[roomName]["users"][username];
    if (Object.keys(rooms[roomName]["users"]).length === 0){
      // If a room is empty, delete it and push the room's termination to all active users
      delete rooms[roomName];
      socketio.emit('update-room-list',  Object.keys(rooms));
    } else {
      // If leader has left, select a new leader.
      if (rooms[roomName]["leader"] == username){
        let usersInRoom = getUsersInRoom(roomName);
        rooms[roomName]["leader"] = usersInRoom[0];
        rooms[roomName]["users"][usersInRoom[0]]["leader"] = true;
        socketio.to(usernames[usersInRoom[0]]).emit('set-user-as-leader');
      }
      // Otherwise, only update available rooms for the user that has left the room
      socketio.to(socket.id).emit('update-room-list',  Object.keys(rooms));
      // Also update room status for remaining players in the room.
      updateAllPlayerStatusesInRoom(roomName);
    }
    
		console.log("Rooms: ", rooms);
	});
});


server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

// Run 'node src/index.js' to start server.