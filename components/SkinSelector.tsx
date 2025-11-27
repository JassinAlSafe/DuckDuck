import React from 'react';
import { DuckSkin } from '../types';
import { DUCK_SKINS } from '../constants';

interface SkinSelectorProps {
  selectedSkinId: string;
  highScore: number;
  unlockedSkins: string[];
  onSelectSkin: (skinId: string) => void;
  onBack: () => void;
}

const SkinSelector: React.FC<SkinSelectorProps> = ({
  selectedSkinId,
  highScore,
  unlockedSkins,
  onSelectSkin,
  onBack,
}) => {
  const isUnlocked = (skin: DuckSkin) => {
    if (skin.unlocked) return true;
    return unlockedSkins.includes(skin.id);
  };

  const canUnlock = (skin: DuckSkin) => {
    if (skin.unlocked) return true;
    if (!skin.unlockScore) return true;
    return highScore >= skin.unlockScore;
  };

  return (
    <div className="flex flex-col items-center space-y-6 animate-fade-in w-full max-w-2xl">
      <h2 className="text-2xl md:text-3xl text-yellow-400 drop-shadow-[3px_3px_0_rgba(168,85,247,0.5)]" style={{ fontFamily: '"Press Start 2P", cursive' }}>
        DUCK SKINS
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {DUCK_SKINS.map((skin) => {
          const unlocked = isUnlocked(skin);
          const available = canUnlock(skin);
          const isSelected = selectedSkinId === skin.id;

          return (
            <button
              key={skin.id}
              onClick={() => {
                if (unlocked) {
                  onSelectSkin(skin.id);
                } else if (available) {
                  // Auto-unlock when they have the score
                  onSelectSkin(skin.id);
                }
              }}
              disabled={!available}
              className={`
                relative p-4 rounded-lg border-4 transition-all
                ${isSelected
                  ? 'border-yellow-400 bg-slate-700 scale-105'
                  : unlocked
                    ? 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700'
                    : available
                      ? 'border-green-600 bg-slate-800 hover:border-green-500'
                      : 'border-slate-700 bg-slate-900 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {/* Duck Preview */}
              <div className="flex justify-center mb-3">
                {skin.isSprite ? (
                  // Show actual sprite image for sprite skins
                  <img
                    src="/assets/duck.png"
                    alt={skin.name}
                    className="w-16 h-16 object-contain"
                    style={{
                      filter: unlocked || available ? 'none' : 'grayscale(100%) brightness(0.4)',
                      imageRendering: 'pixelated',
                    }}
                  />
                ) : (
                  <div className="relative">
                    {/* Duck Body */}
                    <div
                      className="w-12 h-12 rounded-sm"
                      style={{
                        backgroundColor: unlocked || available
                          ? `rgb(${skin.bodyColor.join(',')})`
                          : 'rgb(60, 60, 60)'
                      }}
                    />
                    {/* Eye */}
                    <div
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        top: '8px',
                        right: '10px',
                        backgroundColor: unlocked || available
                          ? `rgb(${skin.eyeColor.join(',')})`
                          : 'rgb(30, 30, 30)'
                      }}
                    />
                    {/* Beak */}
                    <div
                      className="absolute w-4 h-2 rounded-sm"
                      style={{
                        top: '16px',
                        right: '-4px',
                        backgroundColor: unlocked || available
                          ? `rgb(${skin.beakColor.join(',')})`
                          : 'rgb(50, 50, 50)'
                      }}
                    />
                    {/* Wing */}
                    <div
                      className="absolute w-4 h-3 rounded-sm"
                      style={{
                        top: '24px',
                        left: '4px',
                        backgroundColor: unlocked || available
                          ? `rgb(${skin.wingColor.join(',')})`
                          : 'rgb(40, 40, 40)'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Skin Name */}
              <p className="text-[8px] text-center text-white mb-1" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                {skin.name}
              </p>

              {/* Lock/Unlock Status */}
              {!unlocked && (
                <div className="text-[6px] text-center">
                  {available ? (
                    <span className="text-green-400">CLICK TO UNLOCK!</span>
                  ) : (
                    <span className="text-slate-500">
                      {skin.unlockScore ? `SCORE ${skin.unlockScore}` : 'LOCKED'}
                    </span>
                  )}
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] px-2 py-1 rounded" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                  OK
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* High Score Display */}
      <p className="text-slate-500 text-xs">
        Your High Score: <span className="text-yellow-400">{highScore}</span>
      </p>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="bg-slate-700 hover:bg-slate-600 text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 py-3 px-8 font-bold text-sm transition-all"
      >
        BACK
      </button>
    </div>
  );
};

export default SkinSelector;
