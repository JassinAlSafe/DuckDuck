import React from 'react';

interface GameOverProps {
  score: number;
  commentary: string | null;
  onRetry: () => void;
  onHome: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, commentary, onRetry, onHome }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg p-6 animate-fade-in">
      <h2 className="text-4xl text-red-500 mb-2 drop-shadow-md" style={{ fontFamily: '"Press Start 2P", cursive' }}>GAME OVER</h2>
      <p className="text-white text-lg mb-6">FINAL SCORE: {score}</p>
      
      {/* AI Commentary */}
      {commentary && (
        <div className="bg-slate-800 p-4 rounded border-l-4 border-yellow-400 mb-8 max-w-md">
          <div className="flex gap-3 items-center mb-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-sm relative">
              <div className="absolute top-2 right-0 w-1 h-1 bg-black"></div>
              <div className="absolute top-4 -right-1 w-2 h-1 bg-orange-500"></div>
            </div>
            <span className="text-yellow-400 text-xs uppercase">Wise Duck Says:</span>
          </div>
          <p className="text-xs md:text-sm leading-relaxed text-gray-200">"{commentary}"</p>
        </div>
      )}

      <div className="flex gap-4">
        <button 
          onClick={onHome}
          className="px-6 py-3 bg-slate-600 text-white rounded hover:bg-slate-500 border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 transition-all"
        >
          HOME
        </button>
        <button 
          onClick={onRetry}
          className="px-6 py-3 bg-yellow-500 text-black rounded hover:bg-yellow-400 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all font-bold"
        >
          RETRY
        </button>
      </div>
      <p className="text-slate-500 text-xs mt-6">Press ESC to Return Home</p>
    </div>
  );
};

export default GameOver;