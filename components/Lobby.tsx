import React from 'react';
import { RoomInfo } from '../types';
import { UsersIcon, TrophyIcon, PlusCircleIcon, ArrowRightOnRectangleIcon } from './Icons';
import { PLAYER_COUNT } from '../constants';

interface LobbyProps {
    rooms: RoomInfo[];
    onCreateRoom: () => void;
    onJoinRoom: (roomId: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ rooms, onCreateRoom, onJoinRoom }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                <div className="text-center mb-8">
                    <TrophyIcon className="w-16 h-16 mx-auto text-yellow-400" />
                    <h1 className="text-4xl font-bold mt-4 tracking-tight">Game Lobby</h1>
                    <p className="text-gray-400 mt-2">Join a game or create your own</p>
                </div>

                <div className="mb-6">
                    <button 
                        onClick={onCreateRoom}
                        className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                        <PlusCircleIcon className="w-6 h-6 mr-2" />
                        Create New Room
                    </button>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {rooms.length > 0 ? rooms.map(room => (
                        <div key={room.id} className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between animate-slide-in-up">
                           <div>
                             <p className="font-bold">Room <span className="font-mono">{room.id}</span></p>
                             <div className="flex items-center text-sm text-gray-400 mt-1">
                                <UsersIcon className="w-4 h-4 mr-1.5" />
                                {room.playerCount} / {PLAYER_COUNT} Players 
                                {room.spectatorCount > 0 && ` (+${room.spectatorCount} watching)`}
                             </div>
                           </div>
                           <button 
                                onClick={() => onJoinRoom(room.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center text-sm"
                            >
                               Join <ArrowRightOnRectangleIcon className="w-4 h-4 ml-1.5" />
                            </button>
                        </div>
                    )) : (
                        <div className="text-center text-gray-500 py-8">
                            <p>No active rooms found.</p>
                            <p>Why not create the first one?</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Lobby;
