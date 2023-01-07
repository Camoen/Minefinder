const http = require('http');
const express = require('express');
const path = require('path')
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const socketio = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var usernames = {};
var rooms = {};


function getUsersInRoom(roomName){
  return Object.keys(rooms[roomName]["users"]);
}

function updateAllPlayerStatusesInRoom(roomName){
  let usersInRoom = getUsersInRoom(roomName);
  for (var i = 0; i < usersInRoom.length; i++){ 
    socketio.to(usernames[usersInRoom[i]]).emit('update-players-in-room', rooms[roomName]["users"]);
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
	});

  socket.on('game-board-reset', (username, roomName, mode)=>{
    // Get all users in the room, then reset all boards
    let usersInRoom = getUsersInRoom(roomName);
    for (var i = 0; i < usersInRoom.length; i++){ 
      // Update current mine count for all users
      rooms[roomName]["users"][usersInRoom[i]]["mines"] = 0;
      // Reset board for all users except lead player (already has reset board)
      if (usersInRoom[i] != username){
        socketio.to(usernames[usersInRoom[i]]).emit('reset-game-board', mode);
      }
      // TODO [Optional]: Can be more efficient by resetting all player mine counts to 0 on client side when game is reset
      updateAllPlayerStatusesInRoom(roomName);
    }
	});

  socket.on('game-cell-flagged', (username, roomName, minesRemaining)=>{
    rooms[roomName]["users"][username]["mines"] = minesRemaining;
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
		console.log("Rooms: ", rooms);
    updateAllPlayerStatusesInRoom(roomName);
	});

  socket.on('user-left-room', (roomName, username)=>{
		delete rooms[roomName]["users"][username];
    if (Object.keys(rooms[roomName]["users"]).length === 0){
      // If a room is empty, delete it and push the room's termination to all active users
      delete rooms[roomName];
      socketio.emit('update-room-list',  Object.keys(rooms));
    } else {
      // Othwerise, only update available rooms for the user that has left the room
      socketio.to(socket.id).emit('update-room-list',  Object.keys(rooms));
      // Also update room status for remaining players in the room.
      updateAllPlayerStatusesInRoom(roomName);
    }
    
		console.log("Rooms: ", rooms);
	});
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});

// Run 'node src/index.js' to start server.