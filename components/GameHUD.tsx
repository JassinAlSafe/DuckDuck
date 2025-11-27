import React from 'react';

interface GameHUDProps {
  currentScore: number;
  highScore: number;
  health: number;
}

const GameHUD: React.FC<GameHUDProps> = ({ currentScore, highScore, health }) => {
  return (
    <div className="w-full flex justify-between items-center bg-slate-800/80 p-4 border-2 border-slate-600 rounded-xl backdrop-blur-sm max-w-[640px] shadow-lg">
      
      {/* Health */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <svg 
            key={i} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill={i < health ? "#ef4444" : "#334155"} 
            className={`w-6 h-6 md:w-8 md:h-8 drop-shadow-md ${i < health ? 'animate-pulse-slow' : ''}`}
            stroke="black"
            strokeWidth="2"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        ))}
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-400 uppercase mb-1">Score</span>
        <span className="text-xl md:text-2xl text-green-400 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" style={{ fontFamily: '"Press Start 2P", cursive' }}>
          {currentScore.toString().padStart(6, '0')}
        </span>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="text-xs text-slate-400 uppercase mb-1">Best</span>
        <span className="text-xl md:text-2xl text-yellow-400 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" style={{ fontFamily: '"Press Start 2P", cursive' }}>
          {highScore.toString().padStart(6, '0')}
        </span>
      </div>
    </div>
  );
};

export default GameHUD;