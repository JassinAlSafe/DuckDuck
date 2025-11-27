import React from 'react';

interface MainMenuProps {
  onStart: () => void;
  onShowLeaderboard: () => void;
  onShowSkins: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, onShowLeaderboard, onShowSkins }) => {
  return (
    <div className="flex flex-col items-center space-y-8 animate-fade-in text-center">
      <h1 className="text-4xl md:text-6xl text-yellow-400 drop-shadow-[4px_4px_0_rgba(168,85,247,0.5)] tracking-tighter" style={{ fontFamily: '"Press Start 2P", cursive' }}>
        DUCK DASH
      </h1>

      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={onStart}
          className="bg-green-500 hover:bg-green-400 text-black border-b-4 border-green-700 active:border-b-0 active:translate-y-1 py-4 px-6 font-bold text-lg transition-all"
        >
          PLAY GAME
        </button>
        <button
          onClick={onShowSkins}
          className="bg-yellow-500 hover:bg-yellow-400 text-black border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 py-4 px-6 font-bold text-lg transition-all"
        >
          SKINS
        </button>
        <button
          onClick={onShowLeaderboard}
          className="bg-slate-700 hover:bg-slate-600 text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 py-4 px-6 font-bold text-lg transition-all"
        >
          LEADERBOARD
        </button>
      </div>

      <p className="text-slate-500 text-xs mt-8">Space to Jump • D to Dash</p>
    </div>
  );
};

export default MainMenu;