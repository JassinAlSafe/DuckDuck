
import React, { useState, useEffect } from 'react';
import DuckGame from './components/DuckGame';
import { GameState, LeaderboardEntry } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lastCommentary, setLastCommentary] = useState<string | null>(null);
  const [gameId, setGameId] = useState(0); // Used to force remount of game
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load Leaderboard on mount
  useEffect(() => {
    const savedLb = localStorage.getItem('duckLeaderboard');
    if (savedLb) {
      setLeaderboard(JSON.parse(savedLb));
    }
    const savedHigh = localStorage.getItem('duckHighScore');
    if (savedHigh) {
        setHighScore(parseInt(savedHigh));
    }
  }, []);

  // Global ESC key listener
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) {
                setGameState(GameState.MENU);
            }
        }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [gameState]);

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  const handleGameOver = (score: number, commentary: string) => {
    setLastCommentary(commentary);
    setGameState(GameState.GAME_OVER);

    // Update High Score
    if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('duckHighScore', score.toString());
    }

    // Update Leaderboard
    const newEntry: LeaderboardEntry = {
        name: "YOU",
        score: score,
        date: new Date().toLocaleDateString()
    };
    
    // Simple leaderboard logic: Top 5
    const newLeaderboard = [...leaderboard, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
        
    setLeaderboard(newLeaderboard);
    localStorage.setItem('duckLeaderboard', JSON.stringify(newLeaderboard));
  };

  const startGame = () => {
      setGameId(prev => prev + 1); // Force fresh instance
      setCurrentScore(0);
      setGameState(GameState.PLAYING);
  };
  
  const goHome = () => {
      setGameState(GameState.MENU);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative text-white selection:bg-yellow-400 selection:text-black font-[Press_Start_2P]">
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="scanlines fixed inset-0 z-0"></div>
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-6">
        
        {/* --- MENU STATE --- */}
        {gameState === GameState.MENU && (
            <div className="flex flex-col items-center space-y-8 animate-fade-in text-center">
                <h1 className="text-4xl md:text-6xl text-yellow-400 drop-shadow-[4px_4px_0_rgba(168,85,247,0.5)] tracking-tighter" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                    DUCK 8-BIT DASH
                </h1>
                
                <div className="flex flex-col gap-4 w-64">
                    <button 
                        onClick={startGame}
                        className="bg-green-500 hover:bg-green-400 text-black border-b-4 border-green-700 active:border-b-0 active:translate-y-1 py-4 px-6 font-bold text-lg transition-all"
                    >
                        PLAY GAME
                    </button>
                    <button 
                        onClick={() => setGameState(GameState.LEADERBOARD)}
                        className="bg-slate-700 hover:bg-slate-600 text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 py-4 px-6 font-bold text-lg transition-all"
                    >
                        LEADERBOARD
                    </button>
                </div>
                
                <p className="text-slate-500 text-xs mt-8">Space to Jump • D to Dash</p>
            </div>
        )}

        {/* --- LEADERBOARD STATE --- */}
        {gameState === GameState.LEADERBOARD && (
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg border-2 border-slate-600 shadow-xl">
                <h2 className="text-2xl text-yellow-400 text-center mb-6" style={{ fontFamily: '"Press Start 2P", cursive' }}>TOP SCORES</h2>
                
                <div className="space-y-4 mb-8">
                    {leaderboard.length === 0 ? (
                        <p className="text-center text-slate-500">No scores yet. Go play!</p>
                    ) : (
                        leaderboard.map((entry, idx) => (
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
                    onClick={goHome}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded hover:scale-105 transition-transform"
                >
                    BACK TO MENU
                </button>
            </div>
        )}

        {/* --- PLAYING & GAME OVER STATE --- */}
        {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
            <>
                {/* Stats Header */}
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

                {/* Game Container */}
                <div className="relative group w-full max-w-2xl">
                    {/* Only render DuckGame if playing, or if we want to show the 'frozen' state. 
                        For simplicity and cleanup, we unmount on Game Over to prevent Kaplay state issues,
                        but we can replace it with a static 'Game Over' card if desired. 
                        Let's keep it mounted but covered for a moment, OR unmount. 
                        Given Kaplay's StrictMode quirks, unmounting is safer for 'Retry'.
                    */}
                    {gameState === GameState.PLAYING ? (
                        <DuckGame 
                          key={gameId}
                          onScoreUpdate={handleScoreUpdate}
                          onGameOver={handleGameOver}
                        />
                    ) : (
                        // Placeholder or Frozen visual when game over (optional, or just show the result card)
                         <div className="w-full aspect-[640/480] bg-slate-800 rounded-lg flex items-center justify-center border-4 border-slate-700">
                             <span className="text-slate-600">GAME OVER</span>
                         </div>
                    )}
                    
                    {/* Scanlines Overlay */}
                    <div className="scanlines absolute inset-0 pointer-events-none rounded-lg"></div>
                    <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-white/10 screen-glow"></div>

                    {/* --- GAME OVER OVERLAY --- */}
                    {gameState === GameState.GAME_OVER && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg p-6 animate-fade-in">
                            <h2 className="text-4xl text-red-500 mb-2 drop-shadow-md" style={{ fontFamily: '"Press Start 2P", cursive' }}>GAME OVER</h2>
                            <p className="text-white text-lg mb-6">FINAL SCORE: {currentScore}</p>
                            
                            {/* AI Commentary */}
                            {lastCommentary && (
                                <div className="bg-slate-800 p-4 rounded border-l-4 border-yellow-400 mb-8 max-w-md">
                                    <div className="flex gap-3 items-center mb-2">
                                        <div className="w-8 h-8 bg-yellow-400 rounded-sm relative">
                                            <div className="absolute top-2 right-0 w-1 h-1 bg-black"></div>
                                            <div className="absolute top-4 -right-1 w-2 h-1 bg-orange-500"></div>
                                        </div>
                                        <span className="text-yellow-400 text-xs uppercase">Wise Duck Says:</span>
                                    </div>
                                    <p className="text-xs md:text-sm leading-relaxed text-gray-200">"{lastCommentary}"</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button 
                                    onClick={goHome}
                                    className="px-6 py-3 bg-slate-600 text-white rounded hover:bg-slate-500 border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    HOME
                                </button>
                                <button 
                                    onClick={startGame}
                                    className="px-6 py-3 bg-yellow-500 text-black rounded hover:bg-yellow-400 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all font-bold"
                                >
                                    RETRY
                                </button>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-6">Press ESC to Return Home</p>
                        </div>
                    )}
                </div>
            </>
        )}

      </div>
      
      <footer className="mt-12 text-slate-600 text-[10px] text-center">
        <p>Built with React, Kaplay & Tailwind • Gemini Powered Commentary</p>
      </footer>
    </div>
  );
}

export default App;
