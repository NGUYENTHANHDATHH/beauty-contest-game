import { Rule } from './types';

export const MAX_PLAYERS = 5;
export const WINNING_PLAYER_COUNT = 1;
export const ELIMINATION_SCORE = -10;
export const STARTING_SCORE = 0;

export const ROUND_TIME_DEFAULT = 60;
export const ROUND_TIME_SPECIAL = 300; // 5 minutes
export const RESULTS_DELAY = 10000; // 10 seconds to show results

export const RULES: Rule[] = [
  {
    id: 1,
    description: "Rule 1: If two or more players choose the same number, their choice becomes invalid.",
    isActive: (eliminatedCount) => eliminatedCount >= 1,
  },
  {
    id: 2,
    description: "Rule 2: Choosing the exact correct number will cause other players to lose two points instead of one.",
    isActive: (eliminatedCount) => eliminatedCount >= 2,
  },
  {
    id: 3,
    description: "Rule 3: If one player chooses 0, another player can win by choosing 100.",
    isActive: (eliminatedCount) => eliminatedCount >= 3,
  },
];
