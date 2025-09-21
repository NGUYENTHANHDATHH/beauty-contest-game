
import React, { useState, useEffect } from 'react';
import { GameState, GamePhase, Player } from './types';
import socket from './socket';
import PlayerStatus from './components/PlayerStatus';
import GameBoard from './components/GameBoard';
import ResultsModal from './components/ResultsModal';
import Lobby from './components/Lobby';
import GameOverScreen from './components/GameOverScreen';
import Login from './components/Login';
import RoomSelection from './components/RoomSelection';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(() => sessionStorage.getItem('playerName'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName) return;

    socket.on('connect', () => {
      console.log('Connected to server with id:', socket.id);
      setClientId(socket.id);
      
      const path = window.location.pathname;
      const roomIdMatch = path.match(/\/room\/([A-Z0-9]{6})/);
      if (roomIdMatch) {
        const roomId = roomIdMatch[1];
        socket.emit('joinRoom', { roomId, name: playerName });
      }
    });

    socket.on('gameStateUpdate', (newState: GameState) => {
      setGameState(newState);
      setError(null);
    });

    socket.on('roomCreated', ({ roomId }: { roomId: string }) => {
        window.history.pushState({}, '', `/room/${roomId}`);
        socket.emit('joinRoom', { roomId, name: playerName });
    });

    socket.on('error', (data: { message: string }) => {
      console.error('Server error:', data.message);
      setError(data.message);
      // If room not found, clear URL and state
      if (data.message.toLowerCase().includes('not found')) {
        window.history.pushState({}, '', '/');
        setGameState(null);
      }
    });
    
    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('gameStateUpdate');
      socket.off('roomCreated');
      socket.off('error');
      socket.disconnect();
    };
  }, [playerName]);

  const handleLogin = (name: string) => {
    sessionStorage.setItem('playerName', name);
    setPlayerName(name);
  };

  const handleCreateRoom = () => socket.emit('createRoom', { name: playerName });
  const handleJoinRoom = (roomId: string) => {
    window.history.pushState({}, '', `/room/${roomId}`);
    socket.emit('joinRoom', { roomId, name: playerName });
  }

  const handleStartGame = () => socket.emit('startGame', { roomId: gameState?.roomId });
  const handlePlayerChoice = (choice: number) => socket.emit('playerChoice', { choice, roomId: gameState?.roomId });
  const handleRestartGame = () => socket.emit('restartGame', { roomId: gameState?.roomId });

  if (!playerName) {
    return <Login onLogin={handleLogin} />;
  }

  if (!gameState) {
    const path = window.location.pathname;
    if (path.match(/\/room\/([A-Z0-9]{6})/)) {
      return (
        <div className="min-h-screen bg-kod-bg flex items-center justify-center text-2xl">
          Joining room...
        </div>
      );
    }
    return <RoomSelection onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  const { players, spectators, gamePhase, round, timer, results, newRuleIntroduced, roomId } = gameState;
  const activePlayers = players.filter(p => !p.isEliminated);
  const currentPlayer = players.find(p => p.id === clientId);
  const isSpectator = spectators.some(s => s.id === clientId);

  const renderGameContent = () => {
    switch (gamePhase) {
      case GamePhase.LOBBY:
        return <Lobby onStart={handleStartGame} players={players} spectators={spectators} clientId={clientId} roomId={roomId} />;
      case GamePhase.INTRODUCTION:
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h1 className="text-4xl lg:text-6xl font-bold text-kod-cyan mb-4">Round {round}</h1>
            <p className="text-xl lg:text-2xl">Prepare yourself.</p>
          </div>
        );
      case GamePhase.GAME_OVER:
        return <GameOverScreen onRestart={handleRestartGame} finalRound={round} isHost={currentPlayer?.isHost} />;
      case GamePhase.GAME_CLEAR:
        return <GameOverScreen onRestart={handleRestartGame} finalRound={round} isClear={true} isHost={currentPlayer?.isHost} />;
      case GamePhase.CHOOSING:
      case GamePhase.RESULTS:
        return (
          <GameBoard 
            players={players} 
            timer={timer}
            gamePhase={gamePhase}
            onPlayerChoice={handlePlayerChoice}
            newRuleIntroduced={newRuleIntroduced}
            currentPlayer={currentPlayer}
            isSpectator={isSpectator}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-kod-bg font-mono p-4 lg:p-8 flex flex-col items-center">
      {error && <div className="absolute top-4 bg-kod-red text-white p-3 rounded-lg shadow-lg animate-fade-in">{error}</div>}
      <header className="w-full max-w-7xl mb-4 lg:mb-8 flex justify-between items-center">
        <h1 className="text-2xl lg:text-4xl font-bold text-kod-cyan tracking-widest">KING OF DIAMONDS</h1>
        <div className="flex items-center space-x-4">
          <div className="text-lg lg:text-xl">Round: <span className="text-kod-cyan font-semibold">{round}</span></div>
          <div className="text-lg lg:text-xl">Players: <span className="text-kod-cyan font-semibold">{activePlayers.length}/{players.length}</span></div>
        </div>
      </header>
      
      <main className="w-full max-w-7xl flex-grow flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4 w-full">
            <div className="bg-kod-gray p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 border-b-2 border-kod-cyan pb-2">Players</h2>
                <div className="space-y-3">
                    {players.map(player => <PlayerStatus key={player.id} player={player} gamePhase={gamePhase} clientId={clientId} />)}
                </div>
                 {spectators.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold mb-3 border-b-2 border-gray-600 pb-2">Spectators ({spectators.length})</h2>
                    <div className="space-y-2 text-sm text-gray-400">
                      {spectators.map(spectator => (
                        <div key={spectator.id} className="p-2 bg-kod-light-gray/50 rounded">{spectator.name} {spectator.id === clientId && "(You)"}</div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
        </aside>
        <section className="lg:w-3/4 w-full flex-grow bg-kod-gray p-4 rounded-lg shadow-lg">
            {renderGameContent()}
        </section>
      </main>

      {gamePhase === GamePhase.RESULTS && results && (
          <ResultsModal results={results} />
      )}
    </div>
  );
};

export default App;
