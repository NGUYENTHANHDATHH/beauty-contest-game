import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';
import { GameState, RoomInfo } from '../types';

export const useSocketGame = (playerName: string | null) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [rooms, setRooms] = useState<RoomInfo[]>([]);

    useEffect(() => {
        if (!playerName) return;

        function onConnect() {
            console.log('Connected to server.');
        }

        function onDisconnect() {
            console.log('Disconnected from server.');
            setGameState(null);
            setRoomId(null);
        }

        function onGameStateUpdate(newState: GameState) {
            setGameState(newState);
        }
        
        function onJoinedRoom({ gameState, playerId, roomId }: { gameState: GameState, playerId: string, roomId: string }) {
            setGameState(gameState);
            setPlayerId(playerId);
            setRoomId(roomId);
        }

        function onRoomListUpdate(roomList: RoomInfo[]) {
            setRooms(roomList);
        }
        
        function onError({ message }: { message: string }) {
            alert(`Server Error: ${message}`);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('gameStateUpdate', onGameStateUpdate);
        socket.on('joinedRoom', onJoinedRoom);
        socket.on('roomListUpdate', onRoomListUpdate);
        socket.on('error', onError);
        
        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('gameStateUpdate', onGameStateUpdate);
            socket.off('joinedRoom', onJoinedRoom);
            socket.off('roomListUpdate', onRoomListUpdate);
            socket.off('error', onError);
            socket.disconnect();
        };
    }, [playerName]);

    const createRoom = useCallback(() => {
        if (playerName) {
            socket.emit('createRoom', { playerName });
        }
    }, [playerName]);
    
    const joinRoom = useCallback((roomIdToJoin: string) => {
        if (playerName) {
            socket.emit('joinRoom', { roomId: roomIdToJoin, playerName });
        }
    }, [playerName]);

    const selectNumber = useCallback((number: number) => {
        socket.emit('selectNumber', { roomId, number });
    }, [roomId]);

    const nextRound = useCallback(() => {
        socket.emit('nextRound', { roomId });
    }, [roomId]);

    const startGame = useCallback(() => {
        socket.emit('startGame', { roomId });
    }, [roomId]);
    
    const resetGame = useCallback(() => {
        socket.emit('resetGame', { roomId });
    }, [roomId]);

    return { gameState, playerId, roomId, rooms, createRoom, joinRoom, selectNumber, nextRound, startGame, resetGame };
};
