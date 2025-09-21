import { Server, Socket } from 'socket.io';
import { GameState, Player, GamePhase, Rule, RoundResult } from './types';
import { INITIAL_SCORE, PLAYER_COUNT, ELIMINATION_SCORE, ROUND_TIME, SPECIAL_ROUND_TIME } from './constants';
import { v4 as uuidv4 } from 'uuid'; // Use a proper UUID library in a real project

const createInitialGameState = (roomId: string, hostId: string, hostName: string): GameState => {
    const hostPlayer: Player = {
        id: hostId,
        name: hostName,
        score: INITIAL_SCORE,
        isHuman: true,
        isHost: true,
        isEliminated: false,
        selectedNumber: null,
        hasSelected: false,
        isSpectator: false,
    };
    return {
        id: roomId,
        players: [hostPlayer],
        round: 0,
        phase: GamePhase.WAITING,
        timer: SPECIAL_ROUND_TIME,
        activeRules: [],
        lastRoundResult: null,
        winner: null,
        hostId: hostId,
    };
};

export class GameManager {
    private rooms: Map<string, GameState> = new Map();
    private playerToRoomMap: Map<string, string> = new Map();
    // FIX: Replace NodeJS.Timeout with a more portable type to avoid namespace errors.
    private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    constructor(private io: Server) {}
    
    // --- Room Management ---

    public createRoom(socket: Socket, playerName: string) {
        const roomId = `room-${uuidv4().slice(0,4)}`;
        const newState = createInitialGameState(roomId, socket.id, playerName);
        this.rooms.set(roomId, newState);
        this.playerToRoomMap.set(socket.id, roomId);
        
        socket.join(roomId);
        socket.emit('joinedRoom', { gameState: newState, playerId: socket.id, roomId });
        this.broadcastRoomList();
    }

    public joinRoom(socket: Socket, roomId: string, playerName: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found.' });
            return;
        }

        const isSpectator = room.players.filter(p => !p.isSpectator).length >= PLAYER_COUNT;

        const newPlayer: Player = {
            id: socket.id,
            name: playerName,
            score: INITIAL_SCORE,
            isHuman: true,
            isHost: false,
            isEliminated: false,
            selectedNumber: null,
            hasSelected: false,
            isSpectator,
        };
        
        if (room.players.find(p => p.id === socket.id)) return; // Already in room

        room.players.push(newPlayer);
        this.playerToRoomMap.set(socket.id, roomId);
        
        socket.join(roomId);
        socket.emit('joinedRoom', { gameState: room, playerId: socket.id, roomId });
        this.emitGameState(roomId);
        this.broadcastRoomList();
    }

    public leaveRoom(socket: Socket) {
        const roomId = this.playerToRoomMap.get(socket.id);
        if (!roomId) return;
        
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.players = room.players.filter(p => p.id !== socket.id);
        this.playerToRoomMap.delete(socket.id);
        socket.leave(roomId);
        
        if (room.players.length === 0) {
            this.rooms.delete(roomId);
            if (this.timers.has(roomId)) {
                clearInterval(this.timers.get(roomId)!);
                this.timers.delete(roomId);
            }
        } else {
             // If host leaves, assign a new host
            if (room.hostId === socket.id) {
                const newHost = room.players.find(p => !p.isSpectator);
                if (newHost) {
                    newHost.isHost = true;
                    room.hostId = newHost.id;
                }
            }
            this.emitGameState(roomId);
        }

        this.broadcastRoomList();
    }
    
    // --- Game Actions ---

    public startGame(roomId: string, playerId: string) {
        const room = this.rooms.get(roomId);
        if (!room || room.hostId !== playerId || room.phase !== GamePhase.WAITING) return;
        
        room.phase = GamePhase.SELECTING;
        room.round = 1;
        room.timer = SPECIAL_ROUND_TIME;
        this.startTimer(roomId);
        this.emitGameState(roomId);
    }
    
    public selectNumber(roomId: string, playerId: string, number: number) {
        const room = this.rooms.get(roomId);
        const player = room?.players.find(p => p.id === playerId);

        if (!room || !player || room.phase !== GamePhase.SELECTING || player.hasSelected || player.isSpectator || player.isEliminated) return;
        
        player.selectedNumber = number;
        player.hasSelected = true;

        const activePlayers = room.players.filter(p => !p.isEliminated && !p.isSpectator);
        if (activePlayers.every(p => p.hasSelected)) {
             if (this.timers.has(roomId)) {
                clearInterval(this.timers.get(roomId)!);
                this.timers.delete(roomId);
            }
            room.phase = GamePhase.CALCULATING;
            this.calculateResults(room);
        }
        
        this.emitGameState(roomId);
    }
    
    public nextRound(roomId: string, playerId: string) {
        const room = this.rooms.get(roomId);
        if (!room || room.hostId !== playerId || room.phase !== GamePhase.RESULTS) return;
        
        const activePlayers = room.players.filter(p => !p.isEliminated && !p.isSpectator);
        if(activePlayers.length <= 1) {
            room.phase = GamePhase.GAME_CLEAR;
            room.winner = activePlayers[0] || null;
            this.emitGameState(roomId);
            return;
        }

        const newRulesIntroduced = room.lastRoundResult?.newRules.length ?? 0 > 0;
        room.round++;
        room.phase = GamePhase.SELECTING;
        room.timer = newRulesIntroduced ? SPECIAL_ROUND_TIME : ROUND_TIME;
        room.players.forEach(p => {
            p.selectedNumber = null;
            p.hasSelected = false;
        });

        this.startTimer(roomId);
        this.emitGameState(roomId);
    }
    
    public resetGame(roomId: string, playerId: string) {
        const room = this.rooms.get(roomId);
        if (!room || room.hostId !== playerId) return;
        
        const originalPlayers = room.players;
        const newHost = originalPlayers.find(p => p.id === room.hostId);
        
        const newState = createInitialGameState(roomId, room.hostId, newHost?.name || 'Host');
        newState.players = originalPlayers.map(p => ({
            ...p,
            score: INITIAL_SCORE,
            isEliminated: false,
            selectedNumber: null,
            hasSelected: false,
        }));
        
        this.rooms.set(roomId, newState);
        this.emitGameState(roomId);
    }
    
    // --- Internal Logic ---

    private startTimer(roomId: string) {
        if (this.timers.has(roomId)) {
            clearInterval(this.timers.get(roomId)!);
        }
        const timer = setInterval(() => {
            const room = this.rooms.get(roomId);
            if (room && room.phase === GamePhase.SELECTING) {
                if (room.timer > 0) {
                    room.timer--;
                    this.emitGameState(roomId);
                } else {
                    clearInterval(timer);
                    this.timers.delete(roomId);
                    room.phase = GamePhase.CALCULATING;
                    this.calculateResults(room);
                    this.emitGameState(roomId);
                }
            } else {
                clearInterval(timer);
                this.timers.delete(roomId);
            }
        }, 1000);
        this.timers.set(roomId, timer);
    }
    
    private calculateResults(room: GameState) {
        const activePlayers = room.players.filter(p => !p.isEliminated && !p.isSpectator);
        const playerChoices = activePlayers.map(p => ({
            name: p.name,
            number: p.selectedNumber,
            isEliminated: p.isEliminated
        }));

        let validChoices: { player: Player, number: number }[] = activePlayers
            .filter(p => p.selectedNumber !== null)
            .map(p => ({ player: p, number: p.selectedNumber! }));

        if (room.activeRules.includes(Rule.DUPLICATE_INVALID)) {
            const counts = validChoices.reduce((acc, choice) => {
                acc[choice.number] = (acc[choice.number] || 0) + 1;
                return acc;
            }, {} as Record<number, number>);
            validChoices = validChoices.filter(choice => counts[choice.number] === 1);
        }

        const sum = validChoices.reduce((acc, choice) => acc + choice.number, 0);
        const average = validChoices.length > 0 ? sum / validChoices.length : 0;
        const target = average * 0.8;
        
        let winner: Player | null = null;
        let specialWinCondition: string | undefined = undefined;

        const choseZero = validChoices.find(c => c.number === 0);
        const choseHundred = validChoices.find(c => c.number === 100);
        if (room.activeRules.includes(Rule.ZERO_WINS_AGAINST_100) && choseZero && choseHundred) {
             winner = choseHundred.player;
             specialWinCondition = `${winner.name} wins with 100 due to the 0-100 Gambit!`;
        } else {
            if (validChoices.length > 0) {
                 winner = validChoices.reduce((closest, current) => {
                    const closestDiff = Math.abs(closest.number - target);
                    const currentDiff = Math.abs(current.number - target);
                    return currentDiff < closestDiff ? current : closest;
                }).player;
            }
        }

        let pointsToLose = 1;
        if (winner && room.activeRules.includes(Rule.EXACT_GUESS_BONUS) && winner.selectedNumber === Math.round(target)) {
            pointsToLose = 2;
        }

        const pointChanges: { playerId: string; change: number }[] = [];
        activePlayers.forEach(p => {
            if (p.id !== winner?.id) {
                pointChanges.push({ playerId: p.id, change: -pointsToLose });
            }
        });
        
        const newlyEliminated: Player[] = [];
        room.players.forEach(p => {
            const change = pointChanges.find(pc => pc.playerId === p.id);
            if (change) {
                p.score += change.change;
                if(p.score <= ELIMINATION_SCORE && !p.isEliminated) {
                    p.isEliminated = true;
                    newlyEliminated.push(p);
                }
            }
        });
        
        const remainingPlayersCount = room.players.filter(p => !p.isEliminated && !p.isSpectator).length;
        const newRules: Rule[] = [];
        if (remainingPlayersCount <= 6 && !room.activeRules.includes(Rule.DUPLICATE_INVALID)) newRules.push(Rule.DUPLICATE_INVALID);
        if (remainingPlayersCount <= 5 && !room.activeRules.includes(Rule.EXACT_GUESS_BONUS)) newRules.push(Rule.EXACT_GUESS_BONUS);
        if (remainingPlayersCount <= 4 && !room.activeRules.includes(Rule.ZERO_WINS_AGAINST_100)) newRules.push(Rule.ZERO_WINS_AGAINST_100);
        
        const result: RoundResult = {
            playerChoices,
            validChoices: validChoices.map(vc => ({name: vc.player.name, number: vc.number})),
            sum, average, target, winner, pointChanges,
            eliminatedPlayerIds: newlyEliminated.map(p => p.id),
            newRules, specialWinCondition
        };
        
        room.lastRoundResult = result;
        room.phase = GamePhase.RESULTS;
        room.activeRules.push(...newRules);

        // Check for human player elimination
        const humanPlayers = room.players.filter(p => p.isHuman && !p.isSpectator);
        if(humanPlayers.every(p => p.isEliminated)) {
            room.phase = GamePhase.GAME_OVER;
        }

        setTimeout(() => this.emitGameState(room.id), 2000); // Delay for transition effect
    }
    
    // --- Emitters ---

    public emitGameState(roomId: string) {
        const room = this.rooms.get(roomId);
        if (room) {
            this.io.to(roomId).emit('gameStateUpdate', room);
        }
    }

    public getRooms() {
        return Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            playerCount: room.players.filter(p => !p.isSpectator).length,
            spectatorCount: room.players.filter(p => p.isSpectator).length,
            phase: room.phase,
        }));
    }

    public broadcastRoomList() {
        this.io.emit('roomListUpdate', this.getRooms());
    }
}
