
import React from 'react';
import { Player } from '../types';

interface LobbyProps {
  onStart: () => void;
  players: Player[];
  spectators: { id: string; name: string }[];
  clientId: string | null;
  roomId: string;
}

const Lobby: React.FC<LobbyProps> = ({ onStart, players, spectators, clientId, roomId }) => {
  const currentPlayer = players.find(p => p.id === clientId);
  const isHost = currentPlayer?.isHost ?? false;
  const canStart = isHost && players.length >= 2;

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    // Maybe show a small "Copied!" message
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4 animate-fade-in">
      <h1 className="text-5xl lg:text-7xl font-bold text-kod-cyan mb-4">King of Diamonds</h1>
      <div className="mb-6 bg-black/30 p-3 rounded-lg flex items-center gap-4">
        <span className="text-gray-400 text-lg">Room ID:</span>
        <span className="text-kod-cyan font-bold text-2xl tracking-widest">{roomId}</span>
        <button onClick={copyRoomId} className="bg-kod-light-gray px-3 py-1 rounded hover:bg-kod-cyan hover:text-black transition-colors">Copy</button>
      </div>

      <div className="w-full max-w-3xl mb-8">
        <div className="bg-kod-gray p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-kod-cyan">Players in Lobby ({players.length}/5)</h2>
          <div className="space-y-2 text-left">
            {players.map(p => (
              <div key={p.id} className="bg-kod-light-gray p-3 rounded flex justify-between items-center">
                <span className="font-semibold text-lg">{p.name} {p.id === clientId && "(You)"}</span>
                <span>{p.isHost ? '👑 Host' : 'Joined'}</span>
              </div>
            ))}
             {Array.from({ length: 5 - players.length }).map((_, i) => (
                <div key={i} className="bg-kod-light-gray/50 p-3 rounded text-gray-500">Waiting for player...</div>
             ))}
          </div>
           {spectators.length > 0 && (
            <div className="mt-4 pt-4 border-t border-kod-light-gray">
              <h3 className="text-xl font-bold mb-2 text-gray-400">Spectators ({spectators.length})</h3>
              <div className="space-y-1 text-left text-sm">
                {spectators.map(s => (
                   <div key={s.id} className="bg-kod-light-gray/50 p-2 rounded text-gray-300">
                     {s.name} {s.id === clientId && "(You)"}
                   </div>
                ))}
              </div>
            </div>
           )}
        </div>
      </div>
      
      {isHost ? (
        <button
          onClick={onStart}
          disabled={!canStart}
          className="bg-kod-cyan text-black font-bold py-4 px-12 rounded text-2xl hover:bg-white hover:shadow-cyan-glow transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none animate-pulse"
        >
          {players.length < 2 ? 'Waiting for more players...' : 'Begin Game'}
        </button>
      ) : (
        <p className="text-xl text-gray-400">Waiting for the host to start the game...</p>
      )}
    </div>
  );
};

export default Lobby;
