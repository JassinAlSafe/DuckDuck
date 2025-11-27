import React from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onBack }) => {
  return (
    <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg border-2 border-slate-600 shadow-xl">
      <h2 className="text-2xl text-yellow-400 text-center mb-6" style={{ fontFamily: '"Press Start 2P", cursive' }}>TOP SCORES</h2>
      
      <div className="space-y-4 mb-8">
        {entries.length === 0 ? (
          <p className="text-center text-slate-500">No scores yet. Go play!</p>
        ) : (
          entries.map((entry, idx) => (
            <div key={idx} className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className={`text-sm ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-slate-400'}`}>
                #{idx + 1} {entry.name}
              </span>
              <span className="text-green-400">{entry.score}</span>
            </div>
          ))
        )}
      </div>
      
      <button 
        onClick={onBack}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded hover:scale-105 transition-transform"
      >
        BACK TO MENU
      </button>
    </div>
  );
};

export default Leaderboard;