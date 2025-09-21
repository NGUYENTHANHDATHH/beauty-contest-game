
import { Rule } from './types';

export const INITIAL_SCORE = 0;
export const PLAYER_COUNT = 7;
export const ELIMINATION_SCORE = -6;

export const BOT_NAMES = [
    "Orion", "Lyra", "Cygnus", "Aquila", "Draco", "Cassiopeia",
];

export const ROUND_TIME = 60; // 1 minute
export const SPECIAL_ROUND_TIME = 300; // 5 minutes

export const RULE_DESCRIPTIONS: Record<Rule, { title: string; description: string }> = {
    [Rule.DUPLICATE_INVALID]: {
        title: "Rule: Duplicate Numbers Invalid",
        description: "If two or more players choose the same number, their choice is invalid for winning."
    },
    [Rule.EXACT_GUESS_BONUS]: {
        title: "Rule: Exact Guess Bonus",
        description: "Guessing the exact target number causes other players to lose 2 points instead of 1."
    },
    [Rule.ZERO_WINS_AGAINST_100]: {
        title: "Rule: The 0-100 Gambit",
        description: "If one player chooses 0, another player can win by choosing 100, overriding the normal win condition."
    }
};
