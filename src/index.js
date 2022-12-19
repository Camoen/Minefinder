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
socketio.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log(socket.username, ' disconnected');
    delete usernames[socket.username];
  });

  socket.on('user-created', (username)=>{
		socket.username = username;
		usernames[username] = username;
		console.log("Users: ", usernames);
	});
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});

// Run 'node src/index.js' to start server.