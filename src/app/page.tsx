'use client';

import { GameCanvas } from '@/components/GameCanvas';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between">
          <a href="/games/" className="mc-link">&lt; BACK TO HUB</a>
          <span className="mc-header">MISSION ACTIVE</span>
        </div>
      </div>

      {/* Game Panel */}
      <div className="mc-panel p-4">
        {/* Title Bar */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#2a2a2a]">
          <div className="mc-dot" />
          <h1 className="mc-header-primary text-lg">CRATES</h1>
        </div>
        
        {/* Game Canvas */}
        <GameCanvas />
      </div>

      {/* Controls */}
      <div className="w-full max-w-2xl mt-4">
        <div className="flex items-center justify-center gap-2">
          <span className="mc-header text-[10px]">CONTROLS:</span>
          <span className="text-[#555555] text-xs font-mono">Arrow keys to move, R to reset</span>
        </div>
      </div>
    </main>
  );
}
