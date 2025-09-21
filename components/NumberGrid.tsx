
import React, { useState } from 'react';

interface NumberGridProps {
    onSelect: (number: number) => void;
    disabled: boolean;
}

const NumberGrid: React.FC<NumberGridProps> = ({ onSelect, disabled }) => {
    const [selected, setSelected] = useState<number | null>(null);

    const handleSelect = (num: number) => {
        if (disabled) return;
        setSelected(num);
        onSelect(num);
    };

    const numbers = Array.from({ length: 101 }, (_, i) => i);

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-300">
                {disabled && selected !== null ? `You have selected ${selected}. Waiting for others.` : "Choose a number between 0 and 100"}
            </h3>
            <div className={`grid grid-cols-10 md:grid-cols-10 lg:grid-cols-10 xl:grid-cols-10 gap-2 p-2 rounded-lg bg-gray-900/50 overflow-y-auto flex-grow ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {numbers.map(num => (
                    <button
                        key={num}
                        onClick={() => handleSelect(num)}
                        disabled={disabled}
                        className={`
                            aspect-square w-full h-full flex items-center justify-center font-bold text-sm md:text-base rounded-md transition-all duration-200
                            ${selected === num ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 scale-110' : 'bg-gray-700 hover:bg-gray-600'}
                            ${disabled && selected !== num ? 'hover:bg-gray-700' : ''}
                        `}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NumberGrid;
