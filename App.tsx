import React, { useState, useEffect } from 'react';
import { useSocketGame } from './hooks/useSocketGame';
import { GamePhase, Player } from './types';
import PlayerCard from './components/PlayerCard';
import NumberGrid from './components/NumberGrid';
import RulesPanel from './components/RulesPanel';
import Timer from './components/Timer';
import ResultsModal from './components/ResultsModal';
import Lobby from './components/Lobby';
import { UsersIcon, TrophyIcon, ArrowPathIcon } from './components/Icons';

const App: React.FC = () => {
    const [playerName, setPlayerName] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    
    const { 
        gameState, 
        playerId, 
        roomId,
        rooms,
        createRoom,
        joinRoom, 
        selectNumber, 
        nextRound, 
        startGame, 
        resetGame
    } = useSocketGame(isLoggedIn ? playerName : null);

    useEffect(() => {
        const storedName = localStorage.getItem('beautyContestPlayerName');
        if (storedName) {
            setPlayerName(storedName);
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim()) {
            localStorage.setItem('beautyContestPlayerName', playerName.trim());
            setIsLoggedIn(true);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 animate-fade-in">
                <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                    <div className="text-center mb-8">
                        <TrophyIcon className="w-16 h-16 mx-auto text-yellow-400" />
                        <h1 className="text-4xl font-bold mt-4 tracking-tight">Beauty Contest</h1>
                        <p className="text-gray-400 mt-2">A Game of Wits & Numbers</p>
                    </div>
                    <form onSubmit={handleLogin}>
                        <div className="mb-6">
                            <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">Enter Your Name</label>
                            <input
                                id="playerName"
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="e.g., Player One"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                            Join
                        </button>
                    </form>
                </div>
            </div>
        );
    }
    
    if (!roomId || !gameState) {
        return <Lobby rooms={rooms} onCreateRoom={createRoom} onJoinRoom={joinRoom} />;
    }

    const { players, phase, timer, round, lastRoundResult, winner, activeRules, hostId } = gameState;
    const humanPlayer = players.find(p => p.id === playerId);
    const isHost = playerId === hostId;
    const isSpectator = humanPlayer?.isSpectator ?? false;

    const renderGameStatus = () => {
        if (phase === GamePhase.WAITING) {
            return (
                <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
                    <UsersIcon className="w-12 h-12 text-gray-400 mb-4"/>
                    <h2 className="text-2xl font-bold">Waiting for players...</h2>
                    <p className="text-gray-400">Room ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{roomId}</span></p>
                    {isHost && (
                         <button onClick={startGame} className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg animate-pulse-strong">
                            Start Game
                        </button>
                    )}
                </div>
            );
        }
        if (phase === GamePhase.GAME_OVER || phase === GamePhase.GAME_CLEAR) {
            return (
                <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
                    <h2 className="text-6xl font-black mb-4 tracking-tighter">{phase === GamePhase.GAME_CLEAR ? "VICTORY!" : "GAME OVER"}</h2>
                    {phase === GamePhase.GAME_CLEAR && winner && (
                        <p className="text-2xl text-yellow-400">{winner.name} is the last one standing!</p>
                    )}
                     {phase === GamePhase.GAME_OVER && (
                        <p className="text-2xl text-red-400">You have been eliminated.</p>
                    )}
                    {isHost && (
                        <button onClick={resetGame} className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center space-x-2">
                            <ArrowPathIcon className="w-5 h-5"/>
                            <span>Play Again</span>
                        </button>
                    )}
                </div>
            )
        }
        
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Round {round}</h2>
                        <Timer key={round} duration={timer} phase={phase} />
                    </div>
                    <div className="flex-grow">
                        <NumberGrid onSelect={selectNumber} disabled={phase !== GamePhase.SELECTING || humanPlayer?.hasSelected || isSpectator} />
                    </div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                   <RulesPanel rules={activeRules} eliminatedCount={7 - players.filter(p => !p.isEliminated && !p.isSpectator).length}/>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4 md:p-8 font-sans">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Beauty Contest</h1>
                 {isSpectator && <div className="font-bold text-lg text-yellow-400">SPECTATING</div>}
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
                    <UsersIcon className="w-5 h-5 text-gray-400"/>
                    <span className="font-medium">{players.filter(p=>!p.isEliminated && !p.isSpectator).length} / {players.filter(p => !p.isSpectator).length} Players</span>
                </div>
            </header>

            <main className="flex-grow grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-1 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Players</h2>
                    <div className="space-y-4">
                        {players.map(player => (
                            <PlayerCard key={player.id} player={player} phase={phase} isYou={player.id === playerId}/>
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-3">
                   {renderGameStatus()}
                </div>
            </main>
            {phase === GamePhase.RESULTS && lastRoundResult && (
                <ResultsModal result={lastRoundResult} onNextRound={nextRound} isHost={isHost} />
            )}
        </div>
    );
};

export default App;
