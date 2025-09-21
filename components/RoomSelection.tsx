
import React, { useState } from 'react';

interface RoomSelectionProps {
    onCreateRoom: () => void;
    onJoinRoom: (roomId: string) => void;
}

const RoomSelection: React.FC<RoomSelectionProps> = ({ onCreateRoom, onJoinRoom }) => {
    const [roomId, setRoomId] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomId.trim()) {
            onJoinRoom(roomId.trim().toUpperCase());
        }
    };

    return (
        <div className="min-h-screen bg-kod-bg flex flex-col items-center justify-center text-center p-4 animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold text-kod-cyan mb-12">Join a Game</h1>
            <div className="w-full max-w-md space-y-8">
                <button
                    onClick={onCreateRoom}
                    className="bg-kod-cyan text-black font-bold py-4 px-12 rounded text-2xl w-full hover:bg-white hover:shadow-cyan-glow transition-all duration-300"
                >
                    Create a New Room
                </button>

                <div className="relative flex items-center">
                    <div className="flex-grow border-t border-kod-light-gray"></div>
                    <span className="flex-shrink mx-4 text-kod-light-gray">OR</span>
                    <div className="flex-grow border-t border-kod-light-gray"></div>
                </div>

                <form onSubmit={handleJoin} className="bg-kod-gray p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-kod-text">Join an Existing Room</h2>
                    <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter Room ID"
                        maxLength={6}
                        className="w-full bg-kod-light-gray text-kod-text p-4 rounded text-lg text-center uppercase focus:outline-none focus:ring-2 focus:ring-kod-cyan mb-6"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-kod-light-gray border-2 border-kod-cyan text-kod-cyan font-bold py-3 px-10 rounded text-xl w-full hover:bg-kod-cyan hover:text-black transition-all duration-300 disabled:bg-gray-500 disabled:text-gray-400 disabled:border-gray-500 disabled:cursor-not-allowed"
                        disabled={!roomId.trim()}
                    >
                        Join Room
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RoomSelection;
