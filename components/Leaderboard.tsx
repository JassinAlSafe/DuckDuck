import React from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onBack: () => void;
  onClear: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onBack, onClear }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if it's an ISO string or old format
      if (isNaN(date.getTime())) {
        return dateString; // Return as-is if can't parse
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getRankStyle = (idx: number) => {
    switch (idx) {
      case 0: return 'text-yellow-400 bg-yellow-400/10';
      case 1: return 'text-gray-300 bg-gray-300/10';
      case 2: return 'text-orange-400 bg-orange-400/10';
      default: return 'text-slate-400 bg-slate-400/5';
    }
  };

  const getRankIcon = (idx: number) => {
    switch (idx) {
      case 0: return '👑';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  };

  return (
    <div className="w-full max-w-xl bg-slate-800 p-10 rounded-lg border-4 border-slate-600 shadow-xl">
      <h2 className="text-2xl text-yellow-400 text-center mb-6" style={{ fontFamily: '"Press Start 2P", cursive' }}>
        TOP SCORES
      </h2>

      <div className="space-y-3 mb-8">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm mb-2">No scores yet!</p>
            <p className="text-slate-600 text-xs">Play a game to get on the board</p>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg border-2 border-slate-700 ${getRankStyle(idx)} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{getRankIcon(idx) || `#${idx + 1}`}</span>
                <div>
                  <p className="font-bold text-sm" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                    {entry.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formatDate(entry.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold text-lg" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                  {entry.score.toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty slots indicator */}
      {entries.length > 0 && entries.length < 5 && (
        <div className="mb-6 text-center">
          <p className="text-slate-600 text-[10px]">
            {5 - entries.length} more slot{5 - entries.length > 1 ? 's' : ''} available!
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded border-b-4 border-slate-900 hover:scale-105 active:border-b-0 active:translate-y-1 transition-all font-bold"
        >
          BACK
        </button>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="px-4 bg-red-900/50 hover:bg-red-800 text-red-400 py-3 rounded border-b-4 border-red-950 hover:scale-105 active:border-b-0 active:translate-y-1 transition-all font-bold text-sm"
          >
            CLEAR
          </button>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
