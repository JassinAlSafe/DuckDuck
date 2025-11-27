import React from 'react';

interface GameOverProps {
  score: number;
  commentary: string | null;
  onRetry: () => void;
  onHome: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, commentary, onRetry, onHome }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg p-6 animate-fade-in overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-white animate-ping"></div>
         <div className="absolute top-[80%] right-[20%] w-3 h-3 bg-red-500 animate-pulse"></div>
         <div className="absolute top-[50%] left-[80%] w-1 h-1 bg-yellow-500 animate-ping delay-700"></div>
      </div>

      {/* Flashing Title */}
      <h2 className="text-5xl md:text-6xl text-red-600 mb-8 drop-shadow-[4px_4px_0_#fff] animate-pulse font-black tracking-widest text-center leading-tight z-10" 
          style={{ fontFamily: '"Press Start 2P", cursive', textShadow: '4px 4px 0px #ffffff' }}>
        GAME<br/>OVER
      </h2>

      {/* Animated Dead Duck Avatar */}
      <div className="relative w-24 h-24 mb-8 z-10 group cursor-default">
        <div className="w-full h-full animate-bounce">
            {/* Body */}
            <div className="absolute inset-0 bg-yellow-400 rounded-sm border-4 border-black"></div>
            {/* Wing (fallen) */}
            <div className="absolute top-12 -left-2 w-8 h-6 bg-yellow-600 border-2 border-black rounded-sm transform -rotate-12"></div>
            {/* Beak (open/askew) */}
            <div className="absolute top-8 -right-4 w-8 h-6 bg-orange-500 border-2 border-black rounded-sm transform rotate-12"></div>
            {/* Eye (X) */}
            <div className="absolute top-3 right-5 text-black font-bold text-2xl leading-none font-sans scale-150">×</div>
            
            {/* Dizzy stars */}
            <div className="absolute -top-6 left-0 text-yellow-200 text-2xl animate-spin duration-[3s]">★</div>
            <div className="absolute -top-4 right-0 text-white text-xl animate-spin direction-reverse duration-[2s]">★</div>
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-slate-800 p-6 rounded-xl border-4 border-slate-600 mb-8 max-w-md w-full relative shadow-2xl z-10">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 text-[10px] font-bold border-2 border-black uppercase tracking-wider shadow-sm">
            Final Score
        </div>
        <p className="text-white text-3xl text-center mb-4 text-green-400 font-bold mt-2" style={{ fontFamily: '"Press Start 2P", cursive' }}>{score}</p>
        
        {/* AI Commentary */}
        {commentary && (
          <div className="border-t-2 border-slate-600 pt-4 mt-2">
            <p className="text-xs md:text-sm leading-relaxed text-gray-300 text-center italic font-mono">"{commentary}"</p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 w-full max-w-xs flex-col sm:flex-row z-10">
        <button 
          onClick={onRetry}
          className="flex-1 px-6 py-4 bg-yellow-500 text-black rounded hover:bg-yellow-400 border-b-8 border-yellow-700 active:border-b-0 active:translate-y-2 active:border-t-8 active:border-transparent transition-all font-bold text-sm tracking-wider shadow-lg group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
             RETRY <span className="animate-pulse">▶</span>
          </span>
        </button>
         <button 
          onClick={onHome}
          className="flex-1 px-6 py-4 bg-slate-600 text-white rounded hover:bg-slate-500 border-b-8 border-slate-800 active:border-b-0 active:translate-y-2 active:border-t-8 active:border-transparent transition-all text-sm tracking-wider shadow-lg"
        >
          HOME
        </button>
      </div>
      
      <p className="text-slate-500 text-[10px] mt-6 animate-pulse z-10">PRESS ESC TO QUIT</p>
    </div>
  );
};

export default GameOver;