
import React from 'react';
import { GamePhase } from '../types';

interface TimerProps {
    duration: number;
    phase: GamePhase;
}

const Timer: React.FC<TimerProps> = ({ duration, phase }) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (phase !== GamePhase.SELECTING) {
        return (
             <div className="bg-gray-700 text-gray-400 font-mono text-lg px-4 py-1.5 rounded-full">
                --:--
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-1.5 rounded-full border border-gray-600">
             <div className={`w-3 h-3 rounded-full ${duration > 10 ? 'bg-green-500' : 'bg-red-500 animate-ping'}`}></div>
             <div className={`w-3 h-3 rounded-full ${duration > 10 ? 'bg-green-500' : 'bg-red-500'}`}></div>
             <span className={`font-mono text-lg font-bold ${duration <= 10 ? 'text-red-400' : 'text-white'}`}>
                {formattedTime}
            </span>
        </div>
    );
};

export default Timer;
