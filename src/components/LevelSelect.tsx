'use client';

import { useState } from 'react';
import { LEVELS } from '@/game/levels';
import { Music } from '@/game/Music';
import { Sound } from '@/game/Sound';

interface LevelSelectProps {
  currentLevel: number;
  completedLevels: number[];
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function LevelSelect({
  currentLevel,
  completedLevels,
  onSelect,
  onClose,
}: LevelSelectProps) {
  const [musicVolume, setMusicVolume] = useState(Music.getVolume());
  const [soundVolume, setSoundVolume] = useState(Sound.getVolume());
  const [musicEnabled, setMusicEnabled] = useState(Music.isEnabled());
  const [soundEnabled, setSoundEnabled] = useState(Sound.isEnabled());

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    Music.setVolume(vol);
  };

  const handleSoundVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setSoundVolume(vol);
    Sound.setVolume(vol);
  };

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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select Level</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
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
                className={`
                  p-3 rounded text-center transition-colors
                  ${isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-green-700 text-white hover:bg-green-600'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                <div className="font-bold">{index + 1}</div>
                <div className="text-xs truncate">{level.name}</div>
                {isCompleted && <div className="text-xs mt-1">✓</div>}
              </button>
            );
          })}
        </div>

        {/* Volume Controls */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Audio Settings</h3>
          
          {/* Music Volume */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-400">Music</label>
              <button
                onClick={toggleMusic}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  musicEnabled
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
              >
                {musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={handleMusicVolumeChange}
              disabled={!musicEnabled}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Sound Volume */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-400">Sound Effects</label>
              <button
                onClick={toggleSound}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  soundEnabled
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
              >
                {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={soundVolume}
              onChange={handleSoundVolumeChange}
              disabled={!soundEnabled}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Click a level to play</p>
          <p>Press Escape to close</p>
        </div>
      </div>
    </div>
  );
}
