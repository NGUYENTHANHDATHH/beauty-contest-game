
import React from 'react';
import { Player, GamePhase } from '../types';
import { RULES } from '../constants';
import NumberGrid from './NumberGrid';

interface GameBoardProps {
  players: Player[];
  timer: number;
  gamePhase: GamePhase;
  onPlayerChoice: (choice: number) => void;
  newRuleIntroduced: boolean;
  currentPlayer: Player | undefined;
  isSpectator: boolean;
}

const RulesDisplay: React.FC<{ eliminatedCount: number }> = ({ eliminatedCount }) => (
  <div className="bg-black/30 p-4 rounded-lg">
    <h3 className="text-lg font-bold mb-2 text-kod-cyan">Active Rules</h3>
    <ul className="space-y-2 list-disc list-inside text-sm">
      <li>Choose a number (0-100). Winner is closest to 0.8 * average. Losers lose 1 point.</li>
      {RULES.map(rule => (
        rule.isActive(eliminatedCount) && (
          <li key={rule.id} className="text-kod-green animate-fade-in">{rule.description}</li>
        )
      ))}
    </ul>
  </div>
);

const TimerDisplay: React.FC<{ timer: number; newRule: boolean }> = ({ timer, newRule }) => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const isUrgent = timer <= 10;

    return (
        <div className="text-center">
            {newRule && <p className="text-kod-cyan mb-2 animate-pulse">NEW RULE INTRODUCED. 5 MINUTE ROUND.</p>}
            <p className="text-xl">Time Remaining</p>
            <p className={`text-6xl font-bold ${isUrgent ? 'text-kod-red animate-ping' : 'text-kod-cyan'}`}>
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </p>
        </div>
    );
};


const GameBoard: React.FC<GameBoardProps> = ({ players, timer, gamePhase, onPlayerChoice, newRuleIntroduced, currentPlayer, isSpectator }) => {
  const eliminatedCount = players.filter(p => p.isEliminated).length;

  const renderContent = () => {
    if (isSpectator) {
        return <div className="text-center text-2xl text-gray-400">You are spectating.</div>;
    }

    if (!currentPlayer || currentPlayer.isEliminated) {
        return <div className="text-center text-2xl text-gray-400">You have been eliminated.</div>;
    }
    
    if (gamePhase === GamePhase.CHOOSING) {
        if (currentPlayer.choice === null) {
            return <NumberGrid onSelect={onPlayerChoice} />;
        }
        return (
            <div className="text-center">
                <p className="text-2xl">Your choice is locked in:</p>
                <p className="text-8xl font-bold text-kod-cyan my-4">{currentPlayer.choice}</p>
                <p className="text-lg text-gray-400">Waiting for other players...</p>
            </div>
        );
    }

    return (
        <div className="text-center">
            <p className="text-2xl text-gray-400">Round results are being calculated.</p>
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <RulesDisplay eliminatedCount={eliminatedCount} />
        <TimerDisplay timer={timer} newRule={newRuleIntroduced} />
      </div>
      
      <div className="flex-grow flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default GameBoard;
