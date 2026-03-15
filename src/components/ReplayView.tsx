'use client';

import { useState } from 'react';
import { ReplayData, Replay } from '@/game/Replay';
import { LEVELS } from '@/game/levels';

interface ReplayViewProps {
  replayData: ReplayData;
  onWatch: () => void;
  onClose: () => void;
}

export function ReplayView({ replayData, onWatch, onClose }: ReplayViewProps) {
  const [copied, setCopied] = useState(false);
  const stats = Replay.getStats(replayData);
  const shareCode = Replay.generateShareCode(replayData);
  const levelName = LEVELS[replayData.levelIndex]?.name ?? `Level ${replayData.levelIndex + 1}`;

  const handleCopyCode = async () => {
    try {
      const encoded = Replay.encode(replayData);
      await navigator.clipboard.writeText(encoded);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">
          Level Solved!
        </h2>

        <div className="text-center mb-4">
          <p className="text-gray-300 text-sm">{levelName}</p>
          <p className="text-amber-400 font-mono">{shareCode}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
          <div className="bg-gray-700 rounded p-3">
            <p className="text-gray-400 text-xs">Moves</p>
            <p className="text-2xl font-bold text-white">{replayData.finalMoves}</p>
          </div>
          <div className="bg-gray-700 rounded p-3">
            <p className="text-gray-400 text-xs">Pushes</p>
            <p className="text-2xl font-bold text-white">{replayData.finalPushes}</p>
          </div>
          <div className="bg-gray-700 rounded p-3">
            <p className="text-gray-400 text-xs">Time</p>
            <p className="text-2xl font-bold text-white">{formatTime(stats.durationSeconds)}</p>
          </div>
          <div className="bg-gray-700 rounded p-3">
            <p className="text-gray-400 text-xs">Moves/sec</p>
            <p className="text-2xl font-bold text-white">{stats.movesPerSecond.toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-gray-700 rounded p-3 mb-6">
          <p className="text-gray-400 text-xs mb-2 text-center">Direction Breakdown</p>
          <div className="flex justify-center gap-4 text-sm">
            <span className="text-white">↑{stats.upCount}</span>
            <span className="text-white">↓{stats.downCount}</span>
            <span className="text-white">←{stats.leftCount}</span>
            <span className="text-white">→{stats.rightCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onWatch}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors"
          >
            Watch Replay
          </button>
          <button
            onClick={handleCopyCode}
            className="w-full py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Replay Code'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
