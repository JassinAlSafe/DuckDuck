import React from 'react';

interface GameHUDProps {
  currentScore: number;
  highScore: number;
}

const GameHUD: React.FC<GameHUDProps> = ({ currentScore, highScore }) => {
  return (
    <div className="w-full flex justify-between items-center bg-slate-800/80 p-4 border-2 border-slate-600 rounded-xl backdrop-blur-sm max-w-[640px]">
      <div className="flex flex-col">
        <span className="text-xs text-slate-400 uppercase mb-1">Score</span>
        <span className="text-xl md:text-2xl text-green-400" style={{ fontFamily: '"Press Start 2P", cursive' }}>
          {currentScore.toString().padStart(6, '0')}
        </span>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="text-xs text-slate-400 uppercase mb-1">Best</span>
        <span className="text-xl md:text-2xl text-yellow-400" style={{ fontFamily: '"Press Start 2P", cursive' }}>
          {highScore.toString().padStart(6, '0')}
        </span>
      </div>
    </div>
  );
};

export default GameHUD;