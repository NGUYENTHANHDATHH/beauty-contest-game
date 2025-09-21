import React from 'react';

interface GameOverScreenProps {
  onRestart: () => void;
  finalRound: number;
  isClear?: boolean;
  isHost?: boolean;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart, finalRound, isClear = false, isHost = false }) => {
  const title = isClear ? "GAME CLEAR" : "GAME OVER";
  const message = isClear 
    ? `Congratulations. You survived ${finalRound} rounds and became the new King of Diamonds.`
    : `You have been eliminated after ${finalRound} rounds. Your time is up.`;
  const titleColor = isClear ? 'text-kod-cyan shadow-cyan-glow' : 'text-kod-red shadow-red-glow';

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4 animate-fade-in">
      <h1 className={`text-6xl lg:text-8xl font-black mb-6 ${titleColor}`}>{title}</h1>
      <p className="text-xl lg:text-2xl max-w-2xl mb-10 text-kod-text">
        {message}
      </p>
      {isHost ? (
        <button
          onClick={onRestart}
          className="bg-kod-light-gray border-2 border-kod-cyan text-kod-cyan font-bold py-3 px-10 rounded text-xl hover:bg-kod-cyan hover:text-black transition-all duration-300"
        >
          Play Again
        </button>
      ) : (
        <p className="text-lg text-gray-400">Waiting for the host to start a new game.</p>
      )}
    </div>
  );
};

export default GameOverScreen;
