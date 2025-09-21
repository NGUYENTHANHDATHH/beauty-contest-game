
import { useState, useEffect, useCallback } from 'react';
import { Player, GameState, GamePhase, Rule, RoundResult } from '../types';
import { BOT_NAMES, INITIAL_SCORE, PLAYER_COUNT, ELIMINATION_SCORE, ROUND_TIME, SPECIAL_ROUND_TIME } from '../constants';

const createInitialPlayers = (humanPlayerName: string): Player[] => {
    const players: Player[] = [];
    players.push({
        id: 'player_human',
        name: humanPlayerName,
        score: INITIAL_SCORE,
        isHuman: true,
        isHost: true,
        isEliminated: false,
        selectedNumber: null,
        hasSelected: false,
        // FIX: Add missing 'isSpectator' property to conform to the Player type.
        isSpectator: false,
    });
    for (let i = 0; i < PLAYER_COUNT - 1; i++) {
        players.push({
            id: `player_bot_${i}`,
            name: BOT_NAMES[i],
            score: INITIAL_SCORE,
            isHuman: false,
            isHost: false,
            isEliminated: false,
            selectedNumber: null,
            hasSelected: false,
            // FIX: Add missing 'isSpectator' property to conform to the Player type.
            isSpectator: false,
        });
    }
    return players;
};

const initialGameState = (humanPlayerName: string): GameState => ({
    // FIX: Add missing 'id' and 'hostId' properties to conform to the GameState type.
    id: 'local_game',
    players: createInitialPlayers(humanPlayerName),
    round: 0,
    phase: GamePhase.WAITING,
    timer: SPECIAL_ROUND_TIME,
    activeRules: [],
    lastRoundResult: null,
    winner: null,
    hostId: 'player_human',
});

export const useGameLogic = (humanPlayerName: string | null) => {
    const [gameState, setGameState] = useState<GameState>(initialGameState(humanPlayerName || "Player"));
    
    useEffect(() => {
        if(humanPlayerName) {
            setGameState(initialGameState(humanPlayerName));
        }
    }, [humanPlayerName]);

    // Timer logic
    useEffect(() => {
        if (gameState.phase !== GamePhase.SELECTING) return;

        if (gameState.timer > 0) {
            const interval = setInterval(() => {
                setGameState(prev => ({ ...prev, timer: prev.timer - 1 }));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            // Time's up, automatically move to calculation
            setGameState(prev => ({ ...prev, phase: GamePhase.CALCULATING }));
        }
    }, [gameState.phase, gameState.timer]);

    // Bot selection logic
    useEffect(() => {
        if (gameState.phase === GamePhase.SELECTING) {
            const activeBots = gameState.players.filter(p => !p.isHuman && !p.isEliminated && !p.hasSelected);
            activeBots.forEach(bot => {
                const delay = Math.random() * 5000 + 1000; // 1-6 seconds delay
                setTimeout(() => {
                    const choice = Math.floor(Math.random() * 101);
                    setGameState(prev => ({
                        ...prev,
                        players: prev.players.map(p => p.id === bot.id ? { ...p, selectedNumber: choice, hasSelected: true } : p)
                    }));
                }, delay);
            });
        }
    }, [gameState.phase, gameState.round]);
    
    // Auto-advance from selection to calculation when all players have chosen
    useEffect(() => {
        if (gameState.phase === GamePhase.SELECTING) {
            const activePlayers = gameState.players.filter(p => !p.isEliminated);
            if (activePlayers.every(p => p.hasSelected)) {
                setTimeout(() => {
                    setGameState(prev => ({ ...prev, phase: GamePhase.CALCULATING }));
                }, 1000); // Short delay for effect
            }
        }
    }, [gameState.players, gameState.phase]);

    // Calculation logic
    useEffect(() => {
        if (gameState.phase !== GamePhase.CALCULATING) return;

        const activePlayers = gameState.players.filter(p => !p.isEliminated);
        const playerChoices = activePlayers.map(p => ({
            name: p.name,
            number: p.selectedNumber,
            isEliminated: p.isEliminated
        }));

        let validChoices: { player: Player, number: number }[] = activePlayers
            .filter(p => p.selectedNumber !== null)
            .map(p => ({ player: p, number: p.selectedNumber! }));

        // Rule: DUPLICATE_INVALID
        if (gameState.activeRules.includes(Rule.DUPLICATE_INVALID)) {
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

        // Rule: ZERO_WINS_AGAINST_100
        const choseZero = validChoices.find(c => c.number === 0);
        const choseHundred = validChoices.find(c => c.number === 100);
        if (gameState.activeRules.includes(Rule.ZERO_WINS_AGAINST_100) && choseZero && choseHundred) {
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

        const pointChanges: { playerId: string; change: number }[] = [];
        let pointsToLose = 1;

        // Rule: EXACT_GUESS_BONUS
        if (winner && gameState.activeRules.includes(Rule.EXACT_GUESS_BONUS) && winner.selectedNumber === Math.round(target)) {
            pointsToLose = 2;
        }

        activePlayers.forEach(p => {
            if (p.id !== winner?.id) {
                pointChanges.push({ playerId: p.id, change: -pointsToLose });
            }
        });
        
        const newPlayersState = gameState.players.map(p => {
            const change = pointChanges.find(pc => pc.playerId === p.id);
            return change ? { ...p, score: p.score + change.change } : p;
        });

        const newlyEliminated = newPlayersState.filter(p => !p.isEliminated && p.score <= ELIMINATION_SCORE);
        const finalPlayersState = newPlayersState.map(p => newlyEliminated.some(ep => ep.id === p.id) ? {...p, isEliminated: true} : p);
        
        const remainingPlayersCount = finalPlayersState.filter(p => !p.isEliminated).length;
        const newRules: Rule[] = [];
        if (remainingPlayersCount <= 6 && !gameState.activeRules.includes(Rule.DUPLICATE_INVALID)) newRules.push(Rule.DUPLICATE_INVALID);
        if (remainingPlayersCount <= 5 && !gameState.activeRules.includes(Rule.EXACT_GUESS_BONUS)) newRules.push(Rule.EXACT_GUESS_BONUS);
        if (remainingPlayersCount <= 4 && !gameState.activeRules.includes(Rule.ZERO_WINS_AGAINST_100)) newRules.push(Rule.ZERO_WINS_AGAINST_100);
        
        const result: RoundResult = {
            playerChoices,
            validChoices: validChoices.map(vc => ({name: vc.player.name, number: vc.number})),
            sum,
            average,
            target,
            winner,
            pointChanges,
            eliminatedPlayerIds: newlyEliminated.map(p => p.id),
            newRules,
            specialWinCondition
        };

        setTimeout(() => { // Simulate calculation time
            setGameState(prev => {
                const updatedPlayers = prev.players.map(p => {
                    const pointChange = result.pointChanges.find(pc => pc.playerId === p.id);
                    const newScore = pointChange ? p.score + pointChange.change : p.score;
                    const isEliminated = newScore <= ELIMINATION_SCORE || p.isEliminated;
                    return { ...p, score: newScore, isEliminated };
                });
                
                return {
                    ...prev,
                    players: updatedPlayers,
                    lastRoundResult: result,
                    phase: GamePhase.RESULTS,
                    activeRules: [...prev.activeRules, ...newRules]
                };
            });
        }, 2000);

    }, [gameState.phase]);


    const selectNumber = useCallback((playerId: string, number: number) => {
        setGameState(prev => {
            if (prev.phase !== GamePhase.SELECTING) return prev;
            return {
                ...prev,
                players: prev.players.map(p => p.id === playerId ? { ...p, selectedNumber: number, hasSelected: true } : p)
            };
        });
    }, []);

    const nextRound = useCallback(() => {
        setGameState(prev => {
            const activePlayers = prev.players.filter(p => !p.isEliminated);
            if (activePlayers.length <= 1) {
                const gameWinner = activePlayers.length === 1 ? activePlayers[0] : null;
                return { ...prev, phase: GamePhase.GAME_CLEAR, winner: gameWinner };
            }

            const humanPlayer = prev.players.find(p => p.isHuman);
            if(humanPlayer?.isEliminated) {
                return { ...prev, phase: GamePhase.GAME_OVER };
            }

            const newRulesIntroduced = prev.lastRoundResult?.newRules.length ?? 0 > 0;
            return {
                ...prev,
                round: prev.round + 1,
                phase: GamePhase.SELECTING,
                timer: newRulesIntroduced ? SPECIAL_ROUND_TIME : ROUND_TIME,
                players: prev.players.map(p => ({ ...p, selectedNumber: null, hasSelected: false }))
            };
        });
    }, []);
    
    const startGame = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            round: 1,
            phase: GamePhase.SELECTING,
            timer: SPECIAL_ROUND_TIME
        }));
    }, []);

    const resetGame = useCallback(() => {
        if (humanPlayerName) {
            setGameState(initialGameState(humanPlayerName));
        }
    }, [humanPlayerName]);


    return { gameState, selectNumber: (num: number) => selectNumber('player_human', num), nextRound, startGame, resetGame };
};
