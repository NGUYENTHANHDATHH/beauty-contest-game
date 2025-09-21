
import { GamePhase, GameState, Player, RoundResult } from './types';
import { ELIMINATION_SCORE, MAX_PLAYERS, RESULTS_DELAY, ROUND_TIME_DEFAULT, ROUND_TIME_SPECIAL, RULES, STARTING_SCORE, WINNING_PLAYER_COUNT } from './constants';

export class Game {
    private state: GameState;
    // Fix: Use ReturnType<typeof setTimeout> for timer interval type safety, as NodeJS.Timeout can cause issues with some TypeScript configurations.
    private timerInterval: ReturnType<typeof setTimeout> | null = null;
    private broadcastUpdate: (gameState: GameState) => void;
    private roomId: string;

    constructor(roomId: string, broadcastUpdate: (gameState: GameState) => void) {
        this.broadcastUpdate = broadcastUpdate;
        this.roomId = roomId;
        this.state = this.getInitialState();
    }

    private getInitialState(): GameState {
        return {
            roomId: this.roomId,
            players: [],
            spectators: [],
            gamePhase: GamePhase.LOBBY,
            round: 1,
            timer: ROUND_TIME_SPECIAL,
            results: null,
            newRuleIntroduced: true,
        };
    }

    public getState = () => this.state;
    
    public addPlayer(id: string, name: string) {
        // Prevent duplicate players/spectators
        if (this.state.players.some(p => p.id === id) || this.state.spectators.some(s => s.id === id)) {
            return;
        }

        const isGameFull = this.state.players.length >= MAX_PLAYERS;
        const isGameInProgress = this.state.gamePhase !== GamePhase.LOBBY;

        if (isGameFull || isGameInProgress) {
            this.state.spectators.push({ id, name });
        } else {
             const player: Player = {
                id,
                name,
                score: STARTING_SCORE,
                choice: null,
                isEliminated: false,
                isWinner: false,
                isHost: this.state.players.length === 0, // First player is the host
            };
            this.state.players.push(player);
        }

        this.broadcastUpdate(this.state);
    }

    public removePlayer(id: string) {
        const playerIndex = this.state.players.findIndex(p => p.id === id);
        
        if (playerIndex !== -1) {
            const wasHost = this.state.players[playerIndex].isHost;
            this.state.players.splice(playerIndex, 1);

            if (wasHost && this.state.players.length > 0) {
                this.state.players[0].isHost = true;
            }

            if (this.state.gamePhase !== GamePhase.LOBBY && this.getActivePlayers().length < 2) {
                this.endGame();
            }
        } else {
            const spectatorIndex = this.state.spectators.findIndex(s => s.id === id);
            if (spectatorIndex !== -1) {
                this.state.spectators.splice(spectatorIndex, 1);
            }
        }

        this.broadcastUpdate(this.state);
    }
    
    public startGame(playerId: string) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player || !player.isHost || this.state.players.length < 2) return;

        this.state.gamePhase = GamePhase.INTRODUCTION;
        this.broadcastUpdate(this.state);
        
        setTimeout(() => {
            this.startChoosingPhase();
        }, 5000);
    }

    private startChoosingPhase() {
        this.state.gamePhase = GamePhase.CHOOSING;
        this.state.results = null;
        this.getActivePlayers().forEach(p => p.choice = null);
        this.startTimer();
        this.broadcastUpdate(this.state);
    }

    private startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.state.timer--;
            if (this.state.timer <= 0) {
                if (this.timerInterval) clearInterval(this.timerInterval);
                this.calculateResults();
            }
            this.broadcastUpdate(this.state);
        }, 1000);
    }
    
    public handlePlayerChoice(playerId: string, choice: number) {
        if (this.state.gamePhase !== GamePhase.CHOOSING) return;
        
        const player = this.getActivePlayers().find(p => p.id === playerId);
        if (player) {
            player.choice = choice;
            
            const allChosen = this.getActivePlayers().every(p => p.choice !== null);
            if(allChosen){
                 if (this.timerInterval) clearInterval(this.timerInterval);
                 this.calculateResults();
            } else {
                 this.broadcastUpdate(this.state);
            }
        }
    }
    
    private getActivePlayers = () => this.state.players.filter(p => !p.isEliminated);
    private getEliminatedCount = () => this.state.players.filter(p => p.isEliminated).length;

    private calculateResults() {
        const activePlayers = this.getActivePlayers();
        const eliminatedCount = this.getEliminatedCount();
        const choices = activePlayers.map(p => ({
            player: p,
            choice: p.choice,
            isValid: true,
        }));
    
        choices.forEach(c => {
            if (c.choice === null) c.isValid = false;
        });

        if (RULES[0].isActive(eliminatedCount)) {
            const choiceCounts: { [key: number]: number } = {};
            choices.forEach(c => {
                if (c.choice !== null) choiceCounts[c.choice] = (choiceCounts[c.choice] || 0) + 1;
            });
            choices.forEach(c => {
                if (c.choice !== null && choiceCounts[c.choice] > 1) c.isValid = false;
            });
        }
    
        const validChoices = choices.filter(c => c.isValid && c.choice !== null);
        const sum = validChoices.reduce((acc, c) => acc + (c.choice ?? 0), 0);
        const average = validChoices.length > 0 ? sum / validChoices.length : 0;
        const target = average * 0.8;
    
        let winner: Player | null = null;
        let zeroHundredRule = false;

        if (activePlayers.length === 2 && RULES[2].isActive(eliminatedCount)) {
            const choseZero = validChoices.find(c => c.choice === 0);
            const choseHundred = validChoices.find(c => c.choice === 100);
            if (choseZero && choseHundred) {
                winner = choseHundred.player;
                zeroHundredRule = true;
            }
        }

        if (!winner) {
            let minDiff = Infinity;
            let potentialWinners: Player[] = [];
            validChoices.forEach(c => {
                if (c.choice !== null) {
                    const diff = Math.abs(c.choice - target);
                    if (diff < minDiff) {
                        minDiff = diff;
                        potentialWinners = [c.player];
                    } else if (diff === minDiff) {
                        potentialWinners.push(c.player);
                    }
                }
            });
            if (potentialWinners.length === 1) {
                winner = potentialWinners[0];
            }
        }
        
        const exactHit = !!winner && Math.abs((winner.choice ?? -1) - target) < 0.001;
        const pointLoss = RULES[1].isActive(eliminatedCount) && exactHit ? -2 : -1;
    
        const pointChanges = activePlayers.map(p => ({
            playerId: p.id,
            change: winner?.id === p.id ? 0 : pointLoss,
        }));
        
        this.state.results = { average, target, winner, choices, pointChanges, exactHit, zeroHundredRule };
        this.state.gamePhase = GamePhase.RESULTS;
        this.broadcastUpdate(this.state);
        
        setTimeout(this.applyResults, RESULTS_DELAY);
    }
    
    private applyResults = () => {
        if (!this.state.results) return;

        const preEliminatedCount = this.getEliminatedCount();

        this.state.players.forEach(p => {
            const changeInfo = this.state.results!.pointChanges.find(c => c.playerId === p.id);
            if (changeInfo) {
                p.score += changeInfo.change;
                if (p.score <= ELIMINATION_SCORE) {
                    p.isEliminated = true;
                }
            }
        });

        const postEliminatedCount = this.getEliminatedCount();
        this.state.newRuleIntroduced = postEliminatedCount > preEliminatedCount;

        const activePlayerCount = this.getActivePlayers().length;

        if (activePlayerCount <= WINNING_PLAYER_COUNT) {
            this.endGame();
        } else {
            this.state.round++;
            this.state.timer = this.state.newRuleIntroduced ? ROUND_TIME_SPECIAL : ROUND_TIME_DEFAULT;
            this.startChoosingPhase();
        }
    }

    private endGame() {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length === 1) {
            activePlayers[0].isWinner = true;
            this.state.gamePhase = GamePhase.GAME_CLEAR;
        } else {
            this.state.gamePhase = GamePhase.GAME_OVER;
        }
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.broadcastUpdate(this.state);
    }
    
    public restartGame(playerId: string) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player || !player.isHost) return;

        const allUsers = [...this.state.players, ...this.state.spectators];

        this.state = this.getInitialState();
        
        // Re-add all users to the new lobby
        allUsers.forEach(user => {
            this.addPlayer(user.id, user.name);
        });

        // The addPlayer method broadcasts, so this is sufficient.
    }
}
