import React, { useState, useEffect, useRef } from 'react';

interface GameOverProps {
  score: number;
  commentary: string | null;
  onRetry: () => void;
  onHome: () => void;
  leaderboardRank: number | null; // null if didn't make leaderboard, 1-5 if did
  onSubmitName: (name: string) => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, commentary, onRetry, onHome, leaderboardRank, onSubmitName }) => {
  const [playerName, setPlayerName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus name input if made leaderboard
    if (leaderboardRank && inputRef.current) {
      inputRef.current.focus();
    }
  }, [leaderboardRank]);

  const handleSubmitName = () => {
    const name = playerName.trim().toUpperCase() || 'AAA';
    onSubmitName(name);
    setNameSubmitted(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitName();
    }
  };

  const getRankText = (rank: number) => {
    switch (rank) {
      case 1: return '1ST PLACE!';
      case 2: return '2ND PLACE!';
      case 3: return '3RD PLACE!';
      default: return `${rank}TH PLACE!`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg p-6 animate-fade-in overflow-hidden">

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-white animate-ping"></div>
         <div className="absolute top-[80%] right-[20%] w-3 h-3 bg-red-500 animate-pulse"></div>
         <div className="absolute top-[50%] left-[80%] w-1 h-1 bg-yellow-500 animate-ping delay-700"></div>
      </div>

      {/* Flashing Title */}
      <h2 className="text-5xl md:text-6xl text-red-600 mb-4 drop-shadow-[4px_4px_0_#fff] animate-pulse font-black tracking-widest text-center leading-tight z-10"
          style={{ fontFamily: '"Press Start 2P", cursive', textShadow: '4px 4px 0px #ffffff' }}>
        GAME<br/>OVER
      </h2>

      {/* Leaderboard Rank Notification */}
      {leaderboardRank && (
        <div className={`mb-4 z-10 ${getRankColor(leaderboardRank)} animate-bounce`}>
          <p className="text-lg" style={{ fontFamily: '"Press Start 2P", cursive' }}>
            {getRankText(leaderboardRank)}
          </p>
        </div>
      )}

      {/* Animated Dead Duck Avatar */}
      <div className="relative w-20 h-20 mb-4 z-10 group cursor-default">
        <div className="w-full h-full animate-bounce">
            {/* Body */}
            <div className="absolute inset-0 bg-yellow-400 rounded-sm border-4 border-black"></div>
            {/* Wing (fallen) */}
            <div className="absolute top-10 -left-2 w-6 h-5 bg-yellow-600 border-2 border-black rounded-sm transform -rotate-12"></div>
            {/* Beak (open/askew) */}
            <div className="absolute top-6 -right-3 w-6 h-5 bg-orange-500 border-2 border-black rounded-sm transform rotate-12"></div>
            {/* Eye (X) */}
            <div className="absolute top-2 right-4 text-black font-bold text-xl leading-none font-sans scale-150">×</div>

            {/* Dizzy stars */}
            <div className="absolute -top-5 left-0 text-yellow-200 text-xl animate-spin duration-[3s]">★</div>
            <div className="absolute -top-3 right-0 text-white text-lg animate-spin direction-reverse duration-[2s]">★</div>
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-slate-800 p-4 rounded-xl border-4 border-slate-600 mb-4 max-w-md w-full relative shadow-2xl z-10">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 text-[10px] font-bold border-2 border-black uppercase tracking-wider shadow-sm">
            Final Score
        </div>
        <p className="text-white text-2xl text-center mb-2 text-green-400 font-bold mt-2" style={{ fontFamily: '"Press Start 2P", cursive' }}>{score}</p>

        {/* Name Input - Only show if made leaderboard and hasn't submitted */}
        {leaderboardRank && !nameSubmitted && (
          <div className="border-t-2 border-slate-600 pt-3 mt-2">
            <p className="text-[10px] text-yellow-400 text-center mb-2" style={{ fontFamily: '"Press Start 2P", cursive' }}>
              ENTER YOUR NAME
            </p>
            <div className="flex gap-2 justify-center">
              <input
                ref={inputRef}
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 10))}
                onKeyPress={handleKeyPress}
                placeholder="AAA"
                maxLength={10}
                className="bg-slate-900 border-2 border-slate-500 text-white text-center px-3 py-2 w-32 uppercase tracking-widest focus:border-yellow-400 focus:outline-none"
                style={{ fontFamily: '"Press Start 2P", cursive', fontSize: '12px' }}
              />
              <button
                onClick={handleSubmitName}
                className="bg-yellow-500 text-black px-4 py-2 border-2 border-yellow-700 hover:bg-yellow-400 transition-colors font-bold text-sm"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Show submitted name */}
        {leaderboardRank && nameSubmitted && (
          <div className="border-t-2 border-slate-600 pt-3 mt-2">
            <p className="text-[10px] text-green-400 text-center" style={{ fontFamily: '"Press Start 2P", cursive' }}>
              SAVED: {playerName.trim().toUpperCase() || 'AAA'}
            </p>
          </div>
        )}

        {/* AI Commentary */}
        {commentary && (
          <div className="border-t-2 border-slate-600 pt-3 mt-2">
            <p className="text-[10px] md:text-xs leading-relaxed text-gray-300 text-center italic font-mono">"{commentary}"</p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 w-full max-w-xs flex-col sm:flex-row z-10">
        <button
          onClick={onRetry}
          className="flex-1 px-6 py-3 bg-yellow-500 text-black rounded hover:bg-yellow-400 border-b-8 border-yellow-700 active:border-b-0 active:translate-y-2 active:border-t-8 active:border-transparent transition-all font-bold text-sm tracking-wider shadow-lg group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
             RETRY <span className="animate-pulse">▶</span>
          </span>
        </button>
         <button
          onClick={onHome}
          className="flex-1 px-6 py-3 bg-slate-600 text-white rounded hover:bg-slate-500 border-b-8 border-slate-800 active:border-b-0 active:translate-y-2 active:border-t-8 active:border-transparent transition-all text-sm tracking-wider shadow-lg"
        >
          HOME
        </button>
      </div>

      <p className="text-slate-500 text-[10px] mt-4 animate-pulse z-10">PRESS ESC TO QUIT</p>
    </div>
  );
};

export default GameOver;
