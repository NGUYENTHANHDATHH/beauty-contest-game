
import React from 'react';

interface NumberGridProps {
  onSelect: (num: number) => void;
}

const NumberButton: React.FC<{ num: number; onClick: (num: number) => void }> = ({ num, onClick }) => (
    <button
        onClick={() => onClick(num)}
        className="
            flex items-center justify-center 
            bg-kod-light-gray 
            rounded 
            font-mono text-lg 
            h-10 
            w-10
            text-kod-text
            hover:bg-kod-cyan hover:text-black hover:shadow-cyan-glow
            focus:outline-none focus:ring-2 focus:ring-kod-cyan
            transition-all duration-200
        "
    >
        {num}
    </button>
);


const NumberGrid: React.FC<NumberGridProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 animate-fade-in">
        <h2 className="text-2xl text-center mb-4 text-kod-cyan">Select Your Number</h2>
        <div className="grid grid-cols-10 md:grid-cols-[repeat(15,minmax(0,1fr))] gap-2">
            {Array.from({ length: 101 }, (_, i) => (
                <NumberButton key={i} num={i} onClick={onSelect} />
            ))}
        </div>
    </div>
  );
};

export default NumberGrid;
