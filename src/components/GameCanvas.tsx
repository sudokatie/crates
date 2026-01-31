'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from '@/game/Game';
import type { GameState } from '@/game/types';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas);
    game.onStateChange = handleStateChange;
    gameRef.current = game;
    setGameState(game.getState());

    return () => {
      game.destroy();
    };
  }, [handleStateChange]);

  const handleUndo = () => gameRef.current?.restart();
  const handleRestart = () => gameRef.current?.restart();
  const handlePrev = () => gameRef.current?.prevLevel();
  const handleNext = () => gameRef.current?.nextLevel();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header */}
      <div className="w-full max-w-xl flex justify-between items-center px-2">
        <h1 className="text-2xl font-bold text-white">CRATES</h1>
        {gameState && (
          <div className="text-sm text-gray-300">
            Level {gameState.levelIndex + 1}: {gameState.level.name}
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-4 border-gray-700 rounded"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Win Overlay */}
        {gameState?.status === 'won' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded">
            <h2 className="text-3xl font-bold text-green-400 mb-2">SOLVED!</h2>
            <p className="text-white mb-1">Moves: {gameState.moves}</p>
            <p className="text-white mb-4">Pushes: {gameState.pushes}</p>
            <p className="text-gray-300 animate-pulse">Press SPACE for next level</p>
          </div>
        )}
      </div>

      {/* Stats */}
      {gameState && (
        <div className="flex gap-6 text-white">
          <div>Moves: <span className="font-mono">{gameState.moves}</span></div>
          <div>Pushes: <span className="font-mono">{gameState.pushes}</span></div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handlePrev}
          disabled={!gameState || gameState.levelIndex === 0}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={handleRestart}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          ↺ Restart
        </button>
        <button
          onClick={handleNext}
          disabled={!gameState || gameState.levelIndex >= 19}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400 text-center max-w-md">
        <p>Arrow keys or WASD to move</p>
        <p>U to undo • R to restart • N/P for next/prev level</p>
      </div>
    </div>
  );
}
