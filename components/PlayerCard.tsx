import React from 'react';
import { Player, GamePhase } from '../types';
import { UserIcon, CheckCircleIcon, ClockIcon, XCircleIcon, EyeIcon } from './Icons';

interface PlayerCardProps {
    player: Player;
    phase: GamePhase;
    isYou: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, phase, isYou }) => {
    const getStatus = () => {
        if (player.isEliminated) {
            return <div className="flex items-center text-red-400"><XCircleIcon className="w-4 h-4 mr-1.5" />Eliminated</div>;
        }
        if (player.isSpectator) {
            return <div className="flex items-center text-cyan-400"><EyeIcon className="w-4 h-4 mr-1.5" />Spectating</div>;
        }
        if (phase === GamePhase.SELECTING) {
            return player.hasSelected ?
                <div className="flex items-center text-green-400"><CheckCircleIcon className="w-4 h-4 mr-1.5" />Chosen</div> :
                <div className="flex items-center text-yellow-400 animate-pulse"><ClockIcon className="w-4 h-4 mr-1.5" />Thinking...</div>;
        }
        if (phase === GamePhase.RESULTS && player.selectedNumber !== null) {
            return <div className="text-gray-300">Chose: <span className="font-bold text-white">{player.selectedNumber}</span></div>;
        }
        return <div className="text-gray-500">Waiting</div>;
    };

    const cardClasses = `
        flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border
        ${isYou ? 'border-indigo-500' : 'border-gray-600'}
        ${player.isEliminated ? 'opacity-50' : ''}
        transition-all duration-300
    `;

    return (
        <div className={cardClasses}>
            <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isYou ? 'bg-indigo-500' : 'bg-gray-600'}`}>
                    <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className={`font-bold ${isYou ? 'text-indigo-300' : 'text-white'}`}>{player.name} {isYou && <span className="text-gray-400 font-normal text-sm">(You)</span>}</p>
                    <p className="text-sm text-gray-400">{getStatus()}</p>
                </div>
            </div>
             {!player.isSpectator && (
                <div className="text-right">
                    <p className="text-xs text-gray-400">Score</p>
                    <p className="text-2xl font-bold">{player.score}</p>
                </div>
            )}
        </div>
    );
};

export default PlayerCard;
