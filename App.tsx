import React, { useState, useEffect } from 'react';
import DuckGame from './components/DuckGame';
import MainMenu from './components/MainMenu';
import Leaderboard from './components/Leaderboard';
import GameOver from './components/GameOver';
import GameHUD from './components/GameHUD';
import SkinSelector from './components/SkinSelector';
import { GameState, LeaderboardEntry, DuckSkin } from './types';
import { DUCK_SKINS } from './constants';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [lastCommentary, setLastCommentary] = useState<string | null>(null);
  const [gameId, setGameId] = useState(0); // Used to force remount of game
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pendingLeaderboardEntry, setPendingLeaderboardEntry] = useState<{ score: number; rank: number } | null>(null);
  const [selectedSkinId, setSelectedSkinId] = useState('classic');
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>([]);

  // Load saved data on mount
  useEffect(() => {
    const savedLb = localStorage.getItem('duckDashLeaderboard');
    if (savedLb) {
      setLeaderboard(JSON.parse(savedLb));
    }
    const savedHigh = localStorage.getItem('duckDashHighScore');
    if (savedHigh) {
      setHighScore(parseInt(savedHigh));
    }
    const savedSkin = localStorage.getItem('duckDashSelectedSkin');
    if (savedSkin) {
      setSelectedSkinId(savedSkin);
    }
    const savedUnlocked = localStorage.getItem('duckDashUnlockedSkins');
    if (savedUnlocked) {
      setUnlockedSkins(JSON.parse(savedUnlocked));
    }
  }, []);

  // Global ESC key listener
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.SKINS || gameState === GameState.LEADERBOARD) {
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

  const handleHealthUpdate = (hp: number) => {
      setHealth(hp);
  }

  const handleGameOver = (score: number, commentary: string) => {
    setLastCommentary(commentary);
    setGameState(GameState.GAME_OVER);

    // Update High Score
    if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('duckDashHighScore', score.toString());
    }

    // Check if score qualifies for leaderboard (top 5)
    const wouldRank = getLeaderboardRank(score);
    if (wouldRank !== null) {
      setPendingLeaderboardEntry({ score, rank: wouldRank });
    } else {
      setPendingLeaderboardEntry(null);
    }
  };

  const getLeaderboardRank = (score: number): number | null => {
    // Check what rank this score would get (1-5, or null if doesn't qualify)
    if (leaderboard.length < 5) {
      // Less than 5 entries, score will make it
      const rank = leaderboard.filter(e => e.score > score).length + 1;
      return rank;
    }
    // Find position in sorted leaderboard
    const lowestScore = leaderboard[leaderboard.length - 1]?.score || 0;
    if (score > lowestScore) {
      const rank = leaderboard.filter(e => e.score > score).length + 1;
      return rank;
    }
    return null; // Didn't make top 5
  };

  const handleSubmitLeaderboardName = (name: string) => {
    if (!pendingLeaderboardEntry) return;

    const newEntry: LeaderboardEntry = {
      name: name,
      score: pendingLeaderboardEntry.score,
      date: new Date().toISOString()
    };

    // Add to leaderboard and keep top 5
    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setLeaderboard(newLeaderboard);
    localStorage.setItem('duckDashLeaderboard', JSON.stringify(newLeaderboard));
  };

  const clearLeaderboard = () => {
    if (confirm('Clear all leaderboard scores?')) {
      setLeaderboard([]);
      localStorage.removeItem('duckDashLeaderboard');
    }
  };

  const startGame = () => {
      setGameId(prev => prev + 1); // Force fresh instance
      setCurrentScore(0);
      setHealth(3);
      setGameState(GameState.PLAYING);
  };
  
  const goHome = () => {
    setGameState(GameState.MENU);
  };

  const handleSelectSkin = (skinId: string) => {
    // Check if skin needs to be unlocked
    const skin = DUCK_SKINS.find(s => s.id === skinId);
    if (skin && !skin.unlocked && !unlockedSkins.includes(skinId)) {
      // Unlock the skin
      const newUnlocked = [...unlockedSkins, skinId];
      setUnlockedSkins(newUnlocked);
      localStorage.setItem('duckDashUnlockedSkins', JSON.stringify(newUnlocked));
    }

    setSelectedSkinId(skinId);
    localStorage.setItem('duckDashSelectedSkin', skinId);
  };

  const getSelectedSkin = (): DuckSkin => {
    return DUCK_SKINS.find(s => s.id === selectedSkinId) || DUCK_SKINS[0];
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
            onShowSkins={() => setGameState(GameState.SKINS)}
          />
        )}

        {gameState === GameState.SKINS && (
          <SkinSelector
            selectedSkinId={selectedSkinId}
            highScore={highScore}
            unlockedSkins={unlockedSkins}
            onSelectSkin={handleSelectSkin}
            onBack={goHome}
          />
        )}

        {gameState === GameState.LEADERBOARD && (
            <Leaderboard
                entries={leaderboard}
                onBack={goHome}
                onClear={clearLeaderboard} 
            />
        )}

        {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
            <>
                <GameHUD currentScore={currentScore} highScore={highScore} health={health} />

                <div className="relative group w-full max-w-4xl">
                    {gameState === GameState.PLAYING ? (
                        <DuckGame
                          key={gameId}
                          onScoreUpdate={handleScoreUpdate}
                          onHealthUpdate={handleHealthUpdate}
                          onGameOver={handleGameOver}
                          skin={getSelectedSkin()}
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
                            leaderboardRank={pendingLeaderboardEntry?.rank || null}
                            onSubmitName={handleSubmitLeaderboardName}
                        />
                    )}
                </div>
            </>
        )}

      </div>
      
      <footer className="mt-12 text-slate-600 text-[10px] text-center flex flex-col items-center gap-2">
        <p>Duck Dash v1.0 • Created by Jassin Al-Safe</p>
        <a
          href="https://github.com/jassinalsafe"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-slate-400 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" style={{ imageRendering: 'pixelated' }}>
            <path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h2v2H5V5zm4 0h2v2H9V5zM5 9h6v2H5V9z"/>
          </svg>
          <span>GitHub</span>
        </a>
      </footer>
    </div>
  );
}

export default App;