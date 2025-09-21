
export interface Player {
  id: string; // Use socket.id as player ID
  name: string;
  score: number;
  choice: number | null;
  isEliminated: boolean;
  isWinner: boolean;
  isHost: boolean;
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  INTRODUCTION = 'INTRODUCTION',
  CHOOSING = 'CHOOSING',
  RESULTS = 'RESULTS',
  GAME_OVER = 'GAME_OVER',
  GAME_CLEAR = 'GAME_CLEAR',
}

export interface Rule {
  id: number;
  description: string;
  isActive: (eliminatedCount: number) => boolean;
}

export interface RoundResult {
  average: number;
  target: number;
  winner: Player | null;
  choices: { player: Player; choice: number | null; isValid: boolean }[];
  pointChanges: { playerId: string; change: number }[];
  exactHit: boolean;
  zeroHundredRule: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  spectators: { id: string; name: string }[];
  gamePhase: GamePhase;
  round: number;
  timer: number;
  results: RoundResult | null;
  newRuleIntroduced: boolean;
}
