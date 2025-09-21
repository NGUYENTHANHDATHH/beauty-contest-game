import React from 'react';
import { Player, GamePhase } from '../types';

interface PlayerStatusProps {
  player: Player;
  gamePhase: GamePhase;
  clientId: string | null;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ player, gamePhase, clientId }) => {
  const isChoosingPhase = gamePhase === GamePhase.CHOOSING;
  const isCurrentPlayer = player.id === clientId;
  
  const getStatusText = () => {
    if (player.isEliminated) return 'ELIMINATED';
    if (isChoosingPhase) {
      return player.choice !== null ? 'CONFIRMED' : 'CHOOSING...';
    }
    return `Choice: ${player.choice ?? 'N/A'}`;
  };

  const statusColor = player.isEliminated
    ? 'text-kod-red'
    : player.choice !== null && isChoosingPhase
    ? 'text-kod-green'
    : 'text-gray-400';

  const baseClasses = "flex justify-between items-center p-3 rounded-md transition-all duration-300";
  const eliminatedClasses = "bg-red-900/30 opacity-50";
  const humanClasses = "bg-cyan-900/50 border-2 border-kod-cyan shadow-cyan-glow";
  const defaultClasses = "bg-kod-light-gray";

  const containerClasses = `${baseClasses} ${
    player.isEliminated ? eliminatedClasses : (isCurrentPlayer ? humanClasses : defaultClasses)
  }`;

  return (
    <div className={containerClasses}>
      <div>
        <p className={`font-bold text-lg ${player.isEliminated ? 'line-through' : ''}`}>
          {player.name} {isCurrentPlayer && "(You)"} {player.isHost && "👑"}
        </p>
        <p className={`text-sm ${statusColor}`}>{getStatusText()}</p>
      </div>
      <div className={`text-2xl font-bold ${player.score <= -5 ? 'text-kod-red' : 'text-kod-cyan'}`}>
        {player.score}
      </div>
    </div>
  );
};

export default PlayerStatus;
