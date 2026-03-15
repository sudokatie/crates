'use client';

import { useState } from 'react';
import { Replay, ReplayData } from '@/game/Replay';
import { LEVELS } from '@/game/levels';

interface ReplayImportProps {
  onImport: (data: ReplayData) => void;
  onClose: () => void;
}

export function ReplayImport({ onImport, onClose }: ReplayImportProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReplayData | null>(null);

  const handleCodeChange = (value: string) => {
    setCode(value);
    setError(null);
    setPreview(null);

    if (value.trim()) {
      const data = Replay.decode(value.trim());
      if (data) {
        // Validate level exists
        if (data.levelIndex < 0 || data.levelIndex >= LEVELS.length) {
          setError(`Invalid level index: ${data.levelIndex}`);
        } else {
          setPreview(data);
        }
      } else {
        setError('Invalid replay code');
      }
    }
  };

  const handleWatch = () => {
    if (preview) {
      onImport(preview);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-blue-400 mb-4 text-center">
          Import Replay
        </h2>

        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">
            Paste replay code:
          </label>
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="Paste replay code here..."
            className="w-full h-24 bg-gray-700 text-white rounded p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {preview && (
          <div className="mb-4 p-4 bg-gray-700 rounded">
            <h3 className="text-green-400 font-bold mb-2">Replay Preview</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Level:</span>
                <span className="text-white ml-2">
                  {LEVELS[preview.levelIndex]?.name ?? `#${preview.levelIndex + 1}`}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Date:</span>
                <span className="text-white ml-2">{formatDate(preview.timestamp)}</span>
              </div>
              <div>
                <span className="text-gray-400">Moves:</span>
                <span className="text-white ml-2">{preview.finalMoves}</span>
              </div>
              <div>
                <span className="text-gray-400">Pushes:</span>
                <span className="text-white ml-2">{preview.finalPushes}</span>
              </div>
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="text-white ml-2">{formatDuration(preview.duration)}</span>
              </div>
              <div>
                <span className="text-gray-400">Mode:</span>
                <span className="text-white ml-2">
                  {preview.dailyMode ? 'Daily' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleWatch}
            disabled={!preview}
            className={`w-full py-2 font-bold rounded transition-colors ${
              preview
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Watch Replay
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
