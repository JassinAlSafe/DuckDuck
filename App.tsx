import React, { useState } from 'react';
import DuckGame from './components/DuckGame';

function App() {
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lastCommentary, setLastCommentary] = useState<string | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  const handleGameOver = (score: number, commentary: string) => {
    setLastCommentary(commentary);
    setIsGameActive(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative text-white selection:bg-yellow-400 selection:text-black">
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-6">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl text-yellow-400 drop-shadow-[4px_4px_0_rgba(168,85,247,0.5)] tracking-tighter" style={{ fontFamily: '"Press Start 2P", cursive' }}>
            DUCK 8-BIT DASH
          </h1>
          <p className="text-slate-400 text-xs md:text-sm animate-bounce mt-4">
            PRESS SPACE TO JUMP • COLLECT BREAD
          </p>
        </header>

        {/* Stats Bar */}
        <div className="w-full flex justify-between items-center bg-slate-800/80 p-4 border-2 border-slate-600 rounded-xl backdrop-blur-sm max-w-[640px]">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase">Current Score</span>
            <span className="text-2xl text-green-400" style={{ fontFamily: '"Press Start 2P", cursive' }}>
              {currentScore.toString().padStart(6, '0')}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 uppercase">High Score</span>
            <span className="text-2xl text-yellow-400" style={{ fontFamily: '"Press Start 2P", cursive' }}>
              {highScore.toString().padStart(6, '0')}
            </span>
          </div>
        </div>

        {/* Game Viewport */}
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-green-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
                <DuckGame 
                  onScoreUpdate={handleScoreUpdate}
                  onGameOver={handleGameOver}
                  setGameActive={setIsGameActive}
                />
                {/* CRT Overlay Effect defined in index.html */}
                <div className="scanlines rounded-lg"></div>
                <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-white/10 screen-glow"></div>
            </div>
        </div>

        {/* Commentary Section (The AI Part) */}
        {!isGameActive && lastCommentary && (
          <div className="w-full max-w-[640px] bg-slate-800 p-6 border-l-4 border-yellow-400 rounded-r-lg shadow-xl animate-fade-in-up mt-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-400 shrink-0 rounded overflow-hidden flex items-center justify-center border-2 border-white">
                 {/* Pixel Art Duck Face Icon */}
                 <div className="w-8 h-8 bg-yellow-400 relative">
                    <div className="absolute top-2 right-0 w-4 h-2 bg-black"></div> {/* Eye */}
                    <div className="absolute top-4 right-[-4px] w-4 h-2 bg-orange-500"></div> {/* Beak */}
                 </div>
              </div>
              <div>
                <h3 className="text-yellow-400 text-sm mb-1 uppercase tracking-wider">Wise Duck Says:</h3>
                <p className="text-white text-sm md:text-base leading-relaxed" style={{ fontFamily: '"Press Start 2P", cursive', fontSize: '0.7rem', lineHeight: '1.5rem' }}>
                  "{lastCommentary}"
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <footer className="mt-12 text-slate-600 text-xs text-center">
        <p>Built with React, Kaplay & Tailwind • Gemini Powered Commentary</p>
      </footer>
    </div>
  );
}

export default App;
