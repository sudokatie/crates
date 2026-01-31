'use client';

interface HUDProps {
  levelIndex: number;
  levelName: string;
  moves: number;
  pushes: number;
  totalLevels: number;
}

export function HUD({ levelIndex, levelName, moves, pushes, totalLevels }: HUDProps) {
  return (
    <div className="w-full max-w-xl flex justify-between items-center px-2 text-white">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">CRATES</h1>
        <span className="text-sm text-gray-400">
          Level {levelIndex + 1}/{totalLevels}
        </span>
      </div>
      <div className="text-sm text-gray-300">
        {levelName}
      </div>
      <div className="flex gap-4 text-sm">
        <span>Moves: <span className="font-mono">{moves}</span></span>
        <span>Pushes: <span className="font-mono">{pushes}</span></span>
      </div>
    </div>
  );
}
