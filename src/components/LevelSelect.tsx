'use client';

import { LEVELS } from '@/game/levels';

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

        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Click a level to play</p>
          <p>Press Escape to close</p>
        </div>
      </div>
    </div>
  );
}
