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

socketio.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log(socket.username, ' disconnected');
    delete usernames[socket.username];
  });

  socket.on('room-created', (roomName, username)=>{
		rooms[roomName] = new Set();
    rooms[roomName].add(username);
    socketio.emit('update-room-list',  Object.keys(rooms));
		console.log("Rooms: ", rooms);
	});

  socket.on('user-created', (username)=>{
		socket.username = username;
		usernames[username] = username;
    socketio.to(socket.id).emit('update-room-list',  Object.keys(rooms));
    console.log("rooms: ", rooms);
		console.log("Users: ", usernames);
	});

  socket.on('user-deleted', (username)=>{
		delete usernames[socket.username];
		console.log("Users: ", usernames);
	});

  socket.on('user-joined-room', (roomName, username)=>{
		rooms[roomName].add(username);
		console.log("Rooms: ", rooms);
	});

  socket.on('user-left-room', (roomName, username)=>{
		rooms[roomName].delete(username);
    if (rooms[roomName].size === 0){
      // If a room is empty, delete it and push the room's termination to all active users
      delete rooms[roomName];
      socketio.emit('update-room-list',  Object.keys(rooms));
    } else {
      // Othwerise, only update available rooms for the user that has left the room
      socketio.to(socket.id).emit('update-room-list',  Object.keys(rooms));
    }
    
		console.log("Rooms: ", rooms);
	});
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});

// Run 'node src/index.js' to start server.