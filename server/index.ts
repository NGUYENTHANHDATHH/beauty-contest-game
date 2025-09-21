import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameManager } from './GameManager';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server with CORS configuration to allow connections from any origin
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager(io);

// Handle new client connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Send the initial list of rooms to the newly connected client
  socket.emit('roomListUpdate', gameManager.getRooms());

  // Event handler for creating a new room
  socket.on('createRoom', ({ playerName }) => {
    gameManager.createRoom(socket, playerName);
  });

  // Event handler for joining an existing room
  socket.on('joinRoom', ({ roomId, playerName }) => {
    gameManager.joinRoom(socket, roomId, playerName);
  });
  
  // Event handler for a player leaving a room
  socket.on('leaveRoom', () => {
    gameManager.leaveRoom(socket);
  });

  // Event handler for the host starting the game
  socket.on('startGame', ({ roomId }) => {
    gameManager.startGame(roomId, socket.id);
  });

  // Event handler for a player selecting a number
  socket.on('selectNumber', ({ roomId, number }) => {
    gameManager.selectNumber(roomId, socket.id, number);
  });

  // Event handler for proceeding to the next round
  socket.on('nextRound', ({ roomId }) => {
    gameManager.nextRound(roomId, socket.id);
  });
  
  // Event handler for resetting the game in a room
  socket.on('resetGame', ({ roomId }) => {
    gameManager.resetGame(roomId, socket.id);
  });

  // Handle client disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    gameManager.leaveRoom(socket);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
