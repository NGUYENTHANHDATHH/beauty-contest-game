export interface Player {
    id: string;
    name: string;
    score: number;
    isHuman: boolean;
    isHost: boolean;
    isEliminated: boolean;
    selectedNumber: number | null;
    hasSelected: boolean;
    isSpectator: boolean;
}

export enum GamePhase {
    WAITING = 'WAITING',
    SELECTING = 'SELECTING',
    CALCULATING = 'CALCULATING',
    RESULTS = 'RESULTS',
    GAME_OVER = 'GAME_OVER',
    GAME_CLEAR = 'GAME_CLEAR'
}

export enum Rule {
    DUPLICATE_INVALID = 'DUPLICATE_INVALID',
    EXACT_GUESS_BONUS = 'EXACT_GUESS_BONUS',
    ZERO_WINS_AGAINST_100 = 'ZERO_WINS_AGAINST_100'
}

export interface RoundResult {
    playerChoices: { name: string; number: number | null; isEliminated: boolean }[];
    validChoices: { name:string; number: number }[];
    sum: number;
    average: number;
    target: number;
    winner: Player | null;
    pointChanges: { playerId: string; change: number }[];
    eliminatedPlayerIds: string[];
    newRules: Rule[];
    specialWinCondition?: string;
}

export interface GameState {
    id: string;
    players: Player[];
    round: number;
    phase: GamePhase;
    timer: number;
    activeRules: Rule[];
    lastRoundResult: RoundResult | null;
    winner: Player | null;
    hostId: string;
}

export interface RoomInfo {
    id: string;
    playerCount: number;
    spectatorCount: number;
    phase: GamePhase;
}
