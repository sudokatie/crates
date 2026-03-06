'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from '@/game/Game';
import type { GameState } from '@/game/types';
import { HUD } from './HUD';
import { Controls } from './Controls';
import { LevelSelect } from './LevelSelect';
import { DailyComplete } from './DailyComplete';
import { Music } from '@/game/Music';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [dailyResult, setDailyResult] = useState<{
    totalMoves: number;
    totalPushes: number;
    levelsCompleted: number;
    timeSeconds: number;
  } | null>(null);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas);
    game.onStateChange = handleStateChange;
    game.onMenuRequest = () => setShowLevelSelect(true);
    game.onDailyComplete = (result) => {
      setDailyResult({
        totalMoves: result.totalMoves,
        totalPushes: result.totalPushes,
        levelsCompleted: result.levelsCompleted,
        timeSeconds: result.timeSeconds,
      });
    };
    gameRef.current = game;
    setGameState(game.getState());
    setCompletedLevels(game.getCompletedLevels());

    return () => {
      game.destroy();
    };
  }, [handleStateChange]);

  // Update completed levels when state changes
  useEffect(() => {
    if (gameState?.status === 'won' && gameRef.current) {
      setCompletedLevels(gameRef.current.getCompletedLevels());
    }
  }, [gameState?.status]);

  // Switch music tracks based on game state
  useEffect(() => {
    if (!gameState) return;
    
    switch (gameState.status) {
      case 'menu':
        Music.play('menu');
        break;
      case 'playing':
        Music.play('gameplay');
        break;
      case 'won':
        Music.play('victory');
        break;
    }
  }, [gameState?.status]);

  // Handle Escape key for level select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLevelSelect) {
        setShowLevelSelect(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLevelSelect]);

  const handleUndo = () => gameRef.current?.undo();
  const handleRestart = () => gameRef.current?.restart();
  const handlePrev = () => gameRef.current?.prevLevel();
  const handleNext = () => gameRef.current?.nextLevel();
  const handleLevelSelect = (index: number) => {
    gameRef.current?.goToLevel(index);
    setShowLevelSelect(false);
  };
  const handleStartDaily = () => {
    gameRef.current?.startDaily();
    setShowLevelSelect(false);
  };
  const handleDailyClose = () => {
    setDailyResult(null);
    gameRef.current?.exitDaily();
  };

  const totalLevels = gameRef.current?.getLevelCount() ?? 20;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* HUD */}
      {gameState && (
        <HUD
          levelIndex={gameState.levelIndex}
          levelName={gameState.levelName}
          moves={gameState.moves}
          pushes={gameState.pushes}
          totalLevels={totalLevels}
          dailyMode={gameState.dailyMode}
          dailyProgress={gameState.dailyProgress}
        />
      )}

      {/* Canvas Container */}
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="border-4 border-gray-700 rounded"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Win Overlay */}
        {gameState?.status === 'won' && !dailyResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded">
            <h2 className="text-3xl font-bold text-green-400 mb-2">SOLVED!</h2>
            <p className="text-white mb-1">Moves: {gameState.moves}</p>
            <p className="text-white mb-4">Pushes: {gameState.pushes}</p>
            {gameState.dailyMode && gameState.dailyProgress && (
              <p className="text-amber-400 mb-2">
                Daily: {gameState.dailyProgress.current}/{gameState.dailyProgress.total}
              </p>
            )}
            <p className="text-gray-300 animate-pulse">Press SPACE for next level</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {gameState && (
        <Controls
          onUndo={handleUndo}
          onRestart={handleRestart}
          onPrev={handlePrev}
          onNext={handleNext}
          onLevelSelect={() => setShowLevelSelect(true)}
          canUndo={gameState.undoStack.length > 0}
          canPrev={gameState.levelIndex > 0}
          canNext={gameState.levelIndex < totalLevels - 1}
        />
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-400 text-center max-w-md">
        <p>Arrow keys or WASD to move | Click adjacent cell</p>
        <p>U / Ctrl+Z to undo | R to restart | Escape for levels</p>
      </div>

      {/* Level Select Modal */}
      {showLevelSelect && gameState && (
        <LevelSelect
          currentLevel={gameState.levelIndex}
          completedLevels={completedLevels}
          onSelect={handleLevelSelect}
          onStartDaily={handleStartDaily}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* Daily Complete Modal */}
      {dailyResult && (
        <DailyComplete
          totalMoves={dailyResult.totalMoves}
          totalPushes={dailyResult.totalPushes}
          levelsCompleted={dailyResult.levelsCompleted}
          timeSeconds={dailyResult.timeSeconds}
          onSubmit={() => {}}
          onClose={handleDailyClose}
        />
      )}
    </div>
  );
}
