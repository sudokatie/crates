'use client';

interface HUDProps {
  levelIndex: number;
  levelName: string;
  moves: number;
  pushes: number;
  totalLevels: number;
  dailyMode?: boolean;
  dailyProgress?: {
    current: number;
    total: number;
    totalMoves: number;
    totalPushes: number;
  };
}

export function HUD({ levelIndex, levelName, moves, pushes, totalLevels, dailyMode, dailyProgress }: HUDProps) {
  return (
    <div className="w-full flex justify-between items-center text-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="mc-dot" />
          <h1 className="mc-header-primary text-lg">CRATES</h1>
        </div>
        {dailyMode && dailyProgress ? (
          <span className="text-xs text-[#dc2626] tracking-wider">
            DAILY {dailyProgress.current}/{dailyProgress.total}
          </span>
        ) : (
          <span className="text-xs text-[#888888] tracking-wider">
            LEVEL {levelIndex + 1}/{totalLevels}
          </span>
        )}
        <span className="text-xs text-[#555555] tracking-wider uppercase">{levelName}</span>
      </div>
      <div className="flex gap-4 text-xs">
        {dailyMode && dailyProgress ? (
          <>
            <span className="mc-header">TOTAL: <span className="font-mono text-[#dc2626]">{dailyProgress.totalMoves}</span></span>
            <span className="mc-header">THIS: <span className="font-mono text-white">{moves}</span></span>
          </>
        ) : (
          <>
            <span className="mc-header">MOVES: <span className="font-mono text-white">{moves}</span></span>
            <span className="mc-header">PUSHES: <span className="font-mono text-white">{pushes}</span></span>
          </>
        )}
      </div>
    </div>
  );
}
