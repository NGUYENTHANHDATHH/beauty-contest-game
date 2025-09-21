import React from 'react';
import { RoundResult } from '../types';
import { TrophyIcon, ArrowDownIcon } from './Icons';

interface ResultsModalProps {
    result: RoundResult;
    onNextRound: () => void;
    isHost: boolean;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ result, onNextRound, isHost }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-700 animate-slide-in-up">
                <div className="p-8">
                    <h2 className="text-3xl font-bold text-center mb-2">Round Results</h2>
                    {result.winner && (
                         <div className="flex items-center justify-center space-x-2 text-yellow-400 text-xl font-semibold mb-6">
                            <TrophyIcon className="w-6 h-6" />
                            <span>{result.winner.name} wins the round!</span>
                        </div>
                    )}
                    {result.specialWinCondition && (
                        <p className="text-center text-indigo-300 bg-indigo-900/50 py-2 px-4 rounded-lg mb-4 text-sm">{result.specialWinCondition}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                        <div className="bg-gray-700/50 p-4 rounded-lg">
                            <p className="text-sm text-gray-400">Sum of Valid Choices</p>
                            <p className="text-2xl font-bold">{result.sum.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded-lg">
                            <p className="text-sm text-gray-400">Average</p>
                            <p className="text-2xl font-bold">{result.average.toFixed(2)}</p>
                        </div>
                         <div className="bg-indigo-600/50 p-4 rounded-lg border border-indigo-500">
                            <p className="text-sm text-indigo-200">Target Number (Avg x 0.8)</p>
                            <p className="text-2xl font-bold text-white">{result.target.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2 text-center text-gray-300">Player Choices</h3>
                        <div className="max-h-48 overflow-y-auto bg-gray-900/50 p-3 rounded-lg space-y-2">
                             {result.playerChoices.filter(c => !c.isEliminated).map((choice, index) => {
                                const pointChange = result.pointChanges.find(pc => pc.playerId.includes(choice.name.toLowerCase().replace(' ', '_')));
                                const isWinner = result.winner?.name === choice.name;
                                const isInvalid = !result.validChoices.some(vc => vc.name === choice.name);
                                
                                return (
                                    <div key={index} className={`flex justify-between items-center p-2 rounded ${isWinner ? 'bg-green-500/20' : ''} ${isInvalid ? 'bg-red-500/20' : ''}`}>
                                        <span className="font-medium">{choice.name}</span>
                                        <div className="flex items-center space-x-4">
                                            <span className={`font-mono px-2 py-1 rounded text-sm ${isInvalid ? 'text-red-400 line-through' : ''}`}>
                                                {choice.number ?? 'N/A'}
                                            </span>
                                            {pointChange && (
                                                <span className="flex items-center text-red-400 font-bold w-12">
                                                    <ArrowDownIcon className="w-4 h-4 mr-1" />
                                                    {pointChange.change}
                                                </span>
                                            )}
                                            {isWinner && (
                                                <span className="flex items-center text-green-400 font-bold w-12">
                                                     <TrophyIcon className="w-4 h-4 mr-1"/>
                                                     Win
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                     {result.newRules.length > 0 && (
                        <div className="text-center p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg mb-6">
                            <p className="font-bold text-yellow-300">A new rule has been added for the next round!</p>
                        </div>
                    )}
                    {result.eliminatedPlayerIds.length > 0 && (
                         <div className="text-center p-3 bg-red-900/50 border border-red-700 rounded-lg mb-6">
                            <p className="font-bold text-red-300">{result.eliminatedPlayerIds.length} player(s) eliminated!</p>
                        </div>
                    )}

                    {isHost ? (
                        <button onClick={onNextRound} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                            Proceed to Next Round
                        </button>
                    ) : (
                        <p className="text-center text-gray-400">Waiting for the host to start the next round...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResultsModal;
