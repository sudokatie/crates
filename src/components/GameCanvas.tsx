'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from '@/game/Game';
import type { GameState } from '@/game/types';
import type { ReplayData } from '@/game/Replay';
import { HUD } from './HUD';
import { Controls } from './Controls';
import { LevelSelect } from './LevelSelect';
import { DailyComplete } from './DailyComplete';
import { ReplayView } from './ReplayView';
import { ReplayImport } from './ReplayImport';
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
  const [lastReplay, setLastReplay] = useState<ReplayData | null>(null);
  const [showReplayView, setShowReplayView] = useState(false);
  const [showReplayImport, setShowReplayImport] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);

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
    game.onGameOver = (replayData) => {
      setLastReplay(replayData);
      setShowReplayView(true);
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

  // Replay handlers
  const handleWatchReplay = () => {
    if (!lastReplay || !gameRef.current) return;
    setShowReplayView(false);
    setIsReplaying(true);
    gameRef.current.startReplay(lastReplay);
  };

  const handleCloseReplayView = () => {
    setShowReplayView(false);
  };

  const handleStopReplay = () => {
    gameRef.current?.stopReplay();
    setIsReplaying(false);
    setReplayProgress(0);
  };

  const handleImportReplay = (data: ReplayData) => {
    if (!gameRef.current) return;
    setShowReplayImport(false);
    setIsReplaying(true);
    gameRef.current.startReplay(data);
  };

  // Update replay progress
  useEffect(() => {
    if (!isReplaying || !gameRef.current) return;
    
    const interval = setInterval(() => {
      if (gameRef.current?.isReplayMode()) {
        setReplayProgress(gameRef.current.getReplayProgress());
      } else {
        setIsReplaying(false);
        setReplayProgress(0);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isReplaying]);

  const totalLevels = gameRef.current?.getLevelCount() ?? 20;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-xl mb-4">
        <div className="flex items-center justify-between">
          <a href="/games/" className="mc-link">&lt; BACK TO HUB</a>
          <span className="mc-header">MISSION ACTIVE</span>
        </div>
      </div>

      {/* Game Panel */}
      <div className="mc-panel p-6">
        {/* HUD */}
        {gameState && (
          <div className="mb-4 pb-4 border-b border-[#2a2a2a]">
            <HUD
              levelIndex={gameState.levelIndex}
              levelName={gameState.levelName}
              moves={gameState.moves}
              pushes={gameState.pushes}
              totalLevels={totalLevels}
              dailyMode={gameState.dailyMode}
              dailyProgress={gameState.dailyProgress}
            />
          </div>
        )}

        {/* Canvas Container */}
        <div className="relative flex items-center justify-center mb-4">
          <canvas
            ref={canvasRef}
            className="border border-[#2a2a2a]"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Win Overlay - only show in daily mode since normal mode shows ReplayView */}
          {gameState?.status === 'won' && !dailyResult && gameState.dailyMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <h2 className="mc-header-primary text-2xl mb-4">SOLVED</h2>
              <div className="text-[#888888] text-xs tracking-wider mb-1">MOVES: <span className="text-white font-mono">{gameState.moves}</span></div>
              <div className="text-[#888888] text-xs tracking-wider mb-4">PUSHES: <span className="text-white font-mono">{gameState.pushes}</span></div>
              {gameState.dailyProgress && (
                <div className="text-[#dc2626] text-xs tracking-wider mb-4">
                  DAILY {gameState.dailyProgress.current}/{gameState.dailyProgress.total}
                </div>
              )}
              <p className="text-[#555555] text-xs tracking-wider animate-pulse">PRESS SPACE FOR NEXT LEVEL</p>
            </div>
          )}

          {/* Replay playback overlay */}
          {isReplaying && (
            <div className="absolute top-0 left-0 right-0 p-2 bg-black/80 flex items-center gap-2 border-b border-[#2a2a2a]">
              <span className="text-[#dc2626] text-xs tracking-wider">REPLAY</span>
              <div className="flex-1 h-1 bg-[#1a1a1a] overflow-hidden">
                <div
                  className="h-full bg-[#dc2626] transition-all duration-100"
                  style={{ width: `${replayProgress * 100}%` }}
                />
              </div>
              <button
                onClick={handleStopReplay}
                className="px-2 py-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs tracking-wider"
              >
                STOP
              </button>
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
      </div>

      {/* Footer */}
      <div className="w-full max-w-xl mt-4">
        <div className="flex flex-col items-center gap-1">
          <span className="mc-header text-[10px]">CONTROLS</span>
          <span className="text-[#555555] text-xs font-mono">Arrow keys/WASD move | U undo | R restart | ESC levels</span>
        </div>
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

      {/* Replay View Modal */}
      {showReplayView && lastReplay && (
        <ReplayView
          replayData={lastReplay}
          onWatch={handleWatchReplay}
          onClose={handleCloseReplayView}
        />
      )}

      {/* Replay Import Modal */}
      {showReplayImport && (
        <ReplayImport
          onImport={handleImportReplay}
          onClose={() => setShowReplayImport(false)}
        />
      )}

      {/* Import Replay Button */}
      {!isReplaying && !showLevelSelect && !dailyResult && !showReplayView && (
        <button
          onClick={() => setShowReplayImport(true)}
          className="mt-4 px-4 py-2 bg-transparent border border-[#2a2a2a] text-[#888888] text-xs tracking-widest transition-colors hover:text-white hover:border-[#3a3a3a]"
        >
          IMPORT REPLAY
        </button>
      )}
    </div>
  );
}
