
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { Game } from './Game';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 4000;

const rooms = new Map<string, Game>();

interface SocketWithRoom extends Socket {
    roomId?: string;
}

const generateRoomId = (): string => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Ensure room ID is unique
    if(rooms.has(result)) return generateRoomId();
    return result;
}

io.on('connection', (socket: SocketWithRoom) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('createRoom', ({ name }: { name: string }) => {
        const roomId = generateRoomId();
        const game = new Game(roomId, (gameState) => {
            io.to(roomId).emit('gameStateUpdate', gameState);
        });
        rooms.set(roomId, game);
        console.log(`Room created: ${roomId} by ${name}`);
        socket.join(roomId);
        socket.roomId = roomId;
        game.addPlayer(socket.id, name);
        socket.emit('roomCreated', { roomId });
    });

    socket.on('joinRoom', ({ roomId, name }: { roomId: string, name: string }) => {
        const game = rooms.get(roomId);
        if (game) {
            socket.join(roomId);
            socket.roomId = roomId;
            game.addPlayer(socket.id, name);
            console.log(`${name} (${socket.id}) joined room ${roomId}`);
        } else {
            socket.emit('error', { message: `Room ${roomId} not found.` });
        }
    });

    socket.on('startGame', ({ roomId }: { roomId: string }) => {
        const game = rooms.get(roomId);
        if (game) {
            console.log(`Player ${socket.id} started the game in room ${roomId}`);
            game.startGame(socket.id);
        }
    });

    socket.on('playerChoice', ({ choice, roomId }: { choice: number, roomId: string }) => {
        const game = rooms.get(roomId);
        if (game) {
            console.log(`Player ${socket.id} chose ${choice} in room ${roomId}`);
            game.handlePlayerChoice(socket.id, choice);
        }
    });

    socket.on('restartGame', ({ roomId }: { roomId: string }) => {
        const game = rooms.get(roomId);
        if (game) {
            console.log(`Player ${socket.id} is restarting the game in room ${roomId}`);
            game.restartGame(socket.id);
        }
    });
    
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        const roomId = socket.roomId;
        if (roomId) {
            const game = rooms.get(roomId);
            if (game) {
                game.removePlayer(socket.id);
                // Clean up room if it's empty
                const state = game.getState();
                if (state.players.length === 0 && state.spectators.length === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} is empty and has been closed.`);
                }
            }
        }
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
