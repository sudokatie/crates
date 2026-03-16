'use client';

import { useState, useEffect } from 'react';
import { LEVELS } from '@/game/levels';
import { Music } from '@/game/Music';
import { Sound } from '@/game/Sound';
import { DailyLeaderboard } from '@/game/Daily';

interface LevelSelectProps {
  currentLevel: number;
  completedLevels: number[];
  onSelect: (index: number) => void;
  onStartDaily: () => void;
  onClose: () => void;
}

export function LevelSelect({
  currentLevel,
  completedLevels,
  onSelect,
  onStartDaily,
  onClose,
}: LevelSelectProps) {
  const dailyBest = DailyLeaderboard.getBest();
  const [musicVolume, setMusicVolume] = useState(Music.getVolume());
  const [soundVolume, setSoundVolume] = useState(Sound.getVolume());
  const [musicEnabled, setMusicEnabled] = useState(Music.isEnabled());
  const [soundEnabled, setSoundEnabled] = useState(Sound.isEnabled());

  useEffect(() => {
    Music.setVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    Sound.setVolume(soundVolume);
  }, [soundVolume]);

  const toggleMusic = () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    Music.setEnabled(newState);
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    Sound.setEnabled(newState);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 p-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex items-center justify-between">
          <a href="/games/" className="mc-link">&lt; BACK TO HUB</a>
          <button onClick={onClose} className="mc-link">CLOSE X</button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="mc-panel p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Title Bar */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a2a2a]">
          <div className="mc-dot" />
          <h1 className="mc-header-primary text-xl tracking-wider">CRATES - MISSION SELECT</h1>
        </div>

        {/* Daily Challenge */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-[#dc2626]" />
            <span className="mc-header">DAILY CHALLENGE</span>
          </div>
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-4">
            {dailyBest ? (
              <div className="text-center mb-3">
                <span className="mc-header block mb-1">BEST SCORE</span>
                <span className="text-[#dc2626] font-mono text-xl">{dailyBest.totalMoves} MOVES</span>
                <span className="text-[#555555] text-xs block mt-1 font-mono">
                  {dailyBest.levelsCompleted} LEVELS
                </span>
              </div>
            ) : (
              <div className="text-center mb-3">
                <span className="text-[#555555] text-xs tracking-wider">
                  3 RANDOM LEVELS - COMPETE FOR BEST MOVES
                </span>
              </div>
            )}
            <button
              onClick={() => {
                onStartDaily();
                onClose();
              }}
              className="w-full py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm tracking-widest font-medium transition-colors border border-[#dc2626]"
            >
              INITIATE DAILY
            </button>
          </div>
        </div>

        {/* Level Grid */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-[#dc2626]" />
            <span className="mc-header">SELECT MISSION</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {LEVELS.map((level, index) => {
              const isCompleted = completedLevels.includes(index);
              const isCurrent = index === currentLevel;

              return (
                <button
                  key={index}
                  onClick={() => {
                    onSelect(index);
                    onClose();
                  }}
                  className={`p-3 text-center transition border ${
                    isCurrent
                      ? 'bg-[#dc2626] border-[#dc2626] text-white'
                      : isCompleted
                        ? 'bg-[#0d0d0d] border-white text-white hover:border-[#dc2626]'
                        : 'bg-[#0d0d0d] border-[#2a2a2a] text-[#888888] hover:border-[#dc2626] hover:text-white'
                  }`}
                >
                  <div className="font-mono text-lg">{index + 1}</div>
                  <div className="text-[10px] truncate tracking-wider uppercase">{level.name}</div>
                  {isCompleted && <div className="text-[10px] mt-1 text-[#dc2626]">*</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Settings */}
        <div className="border-t border-[#2a2a2a] pt-4">
          <span className="mc-header block mb-3">AUDIO SYSTEMS</span>
          
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={toggleMusic}
              className={`w-8 h-8 flex items-center justify-center text-xs font-mono border transition-colors ${
                musicEnabled 
                  ? 'bg-[#dc2626] border-[#dc2626] text-white' 
                  : 'bg-transparent border-[#2a2a2a] text-[#555555]'
              }`}
            >
              {musicEnabled ? 'ON' : 'OFF'}
            </button>
            <span className="text-[#888888] text-xs tracking-wider w-14">MUSIC</span>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume * 100}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              disabled={!musicEnabled}
              className="flex-1 h-1 bg-[#2a2a2a] appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#dc2626]"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className={`w-8 h-8 flex items-center justify-center text-xs font-mono border transition-colors ${
                soundEnabled 
                  ? 'bg-[#dc2626] border-[#dc2626] text-white' 
                  : 'bg-transparent border-[#2a2a2a] text-[#555555]'
              }`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
            <span className="text-[#888888] text-xs tracking-wider w-14">SFX</span>
            <input
              type="range"
              min="0"
              max="100"
              value={soundVolume * 100}
              onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
              disabled={!soundEnabled}
              className="flex-1 h-1 bg-[#2a2a2a] appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#dc2626]"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-lg mt-4">
        <div className="flex items-center justify-center gap-2">
          <span className="mc-header text-[10px]">CONTROLS:</span>
          <span className="text-[#555555] text-xs font-mono">Arrow keys move | R reset | ESC close</span>
        </div>
      </div>
    </div>
  );
}
