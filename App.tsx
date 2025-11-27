import React, { useState, useEffect } from 'react';
import DuckGame from './components/DuckGame';
import MainMenu from './components/MainMenu';
import Leaderboard from './components/Leaderboard';
import GameOver from './components/GameOver';
import GameHUD from './components/GameHUD';
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
        
        {gameState === GameState.MENU && (
            <MainMenu 
                onStart={startGame} 
                onShowLeaderboard={() => setGameState(GameState.LEADERBOARD)} 
            />
        )}

        {gameState === GameState.LEADERBOARD && (
            <Leaderboard 
                entries={leaderboard} 
                onBack={goHome} 
            />
        )}

        {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
            <>
                <GameHUD currentScore={currentScore} highScore={highScore} />

                <div className="relative group w-full max-w-2xl">
                    {gameState === GameState.PLAYING ? (
                        <DuckGame 
                          key={gameId}
                          onScoreUpdate={handleScoreUpdate}
                          onGameOver={handleGameOver}
                        />
                    ) : (
                         <div className="w-full aspect-[640/480] bg-slate-800 rounded-lg flex items-center justify-center border-4 border-slate-700">
                             <span className="text-slate-600">GAME OVER</span>
                         </div>
                    )}
                    
                    <div className="scanlines absolute inset-0 pointer-events-none rounded-lg"></div>
                    <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-white/10 screen-glow"></div>

                    {gameState === GameState.GAME_OVER && (
                        <GameOver 
                            score={currentScore} 
                            commentary={lastCommentary} 
                            onRetry={startGame} 
                            onHome={goHome} 
                        />
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