
import React from 'react';
import { Rule } from '../types';
import { RULE_DESCRIPTIONS } from '../constants';
import { ScaleIcon } from './Icons';

interface RulesPanelProps {
    rules: Rule[];
    eliminatedCount: number;
}

const RulesPanel: React.FC<RulesPanelProps> = ({ rules, eliminatedCount }) => {
    const renderRule = (rule: Rule, index: number) => {
        const { title, description } = RULE_DESCRIPTIONS[rule];
        return (
            <div key={rule} className="p-4 bg-gray-700/50 rounded-lg animate-slide-in-up" style={{animationDelay: `${index * 100}ms`}}>
                <h4 className="font-bold text-indigo-300">{title}</h4>
                <p className="text-gray-400 text-sm mt-1">{description}</p>
            </div>
        )
    };
    
    return (
        <div className="h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4 flex items-center"><ScaleIcon className="w-6 h-6 mr-2 text-gray-400" />Active Rules</h3>
            <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                 {rules.length === 0 ? (
                    <div className="text-center text-gray-500 pt-8">
                        <p>No special rules active yet.</p>
                        <p className="text-sm">A new rule is added when a player is eliminated.</p>
                    </div>
                ) : (
                    rules.map(renderRule)
                )}
            </div>
             <p className="text-xs text-gray-500 mt-4 text-center">
                {eliminatedCount} player{eliminatedCount !== 1 ? 's' : ''} eliminated.
            </p>
        </div>
    );
};

export default RulesPanel;
