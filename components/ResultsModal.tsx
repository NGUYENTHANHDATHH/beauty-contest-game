import React from 'react';
import { RoundResult } from '../types';

interface ResultsModalProps {
  results: RoundResult;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ results }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-kod-gray rounded-lg shadow-2xl p-8 max-w-4xl w-full border-2 border-kod-cyan">
        <h2 className="text-4xl font-bold text-center mb-6 text-kod-cyan">Round Results</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-black/30 p-4 rounded text-center">
            <p className="text-lg text-gray-400">Average of Valid Choices</p>
            <p className="text-4xl font-bold">{results.average.toFixed(2)}</p>
          </div>
          <div className="bg-black/30 p-4 rounded text-center">
            <p className="text-lg text-gray-400">Target Number (Average x 0.8)</p>
            <p className="text-4xl font-bold text-kod-cyan">{results.target.toFixed(2)}</p>
          </div>
        </div>
        
        {results.winner && (
             <div className="text-center mb-6 bg-green-900/50 p-3 rounded">
                <p className="text-2xl">
                    <span className="font-bold text-kod-green">{results.winner.name}</span> is the winner of this round!
                </p>
                 {results.exactHit && <p className="text-lg text-kod-green animate-pulse">EXACT HIT! Losers lose 2 points.</p>}
                 {results.zeroHundredRule && <p className="text-lg text-kod-green animate-pulse">100 BEATS 0! Rule 3 is in effect.</p>}
            </div>
        )}
        {!results.winner && (
            <div className="text-center mb-6 bg-red-900/50 p-3 rounded">
                <p className="text-2xl text-kod-red">No winner this round. All active players lose points.</p>
            </div>
        )}

        <div className="mb-8">
            <h3 className="text-xl font-bold mb-3">Player Choices & Score Changes</h3>
            <div className="space-y-2">
            {results.choices.sort((a,b) => a.player.name.localeCompare(b.player.name)).map(({ player, choice, isValid }) => {
                const pointChange = results.pointChanges.find(pc => pc.playerId === player.id)?.change ?? 0;
                const scoreColor = pointChange < 0 ? 'text-kod-red' : 'text-kod-green';
                const choiceText = choice === null ? 'No Choice' : choice;
                return (
                    <div key={player.id} className={`flex justify-between items-center p-2 rounded ${!isValid ? 'bg-red-900/30' : 'bg-kod-light-gray'}`}>
                        <span className="font-semibold">{player.name}</span>
                        <span>{choiceText} {!isValid && <span className="text-kod-red text-sm">(Invalid)</span>}</span>
                        <span className={`font-bold text-lg ${scoreColor}`}>{pointChange === 0 ? '±0' : pointChange}</span>
                    </div>
                )
            })}
            </div>
        </div>

        <div className="text-center text-gray-400">
            Proceeding to the next round shortly...
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;
