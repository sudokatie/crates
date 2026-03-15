// Crates - Main Game Class

import { LEVELS, LevelData } from './levels';
import { CELL_SIZE, STORAGE_KEY, DIRECTIONS } from './constants';
import { Renderer } from './Renderer';
import { Input } from './Input';
import { Sound } from './Sound';
import { getDailyLevelIds, DailyLeaderboard, todayString, generateShareCode } from './Daily';
import { Replay, ReplayData } from './Replay';
import type {
  Position,
  Cell,
  Direction,
  Level,
  MoveRecord,
  GameState,
  GameStatus,
  Progress,
} from './types';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: Input;

  private levelIndex: number = 0;
  private level!: Level;
  private player!: Position;
  private crates: Position[] = [];
  private moves: number = 0;
  private pushes: number = 0;
  private undoStack: MoveRecord[] = [];
  private status: GameStatus = 'playing';
  private completedLevels: number[] = [];
  private bestSolutions: { [key: number]: { moves: number; pushes: number } } = {};

  // Daily challenge state
  private dailyMode: boolean = false;
  private dailyLevels: number[] = [];
  private dailyLevelIndex: number = 0;
  private dailyTotalMoves: number = 0;
  private dailyTotalPushes: number = 0;
  private dailyStartTime: number = 0;
  private dailyComplete: boolean = false;

  // Replay state
  private replay: Replay = new Replay();
  private replayMode: boolean = false;
  private replayData: ReplayData | null = null;
  private replayAnimationId: number | null = null;
  private levelsCompletedInSession: number = 0;

  onStateChange?: (state: GameState) => void;
  onMenuRequest?: () => void;
  onGameOver?: (replayData: ReplayData) => void;
  onDailyComplete?: (result: {
    rank: number | null;
    totalMoves: number;
    totalPushes: number;
    levelsCompleted: number;
    timeSeconds: number;
    shareCode: string;
  }) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);

    this.input = new Input({
      onMove: (dir) => this.move(dir),
      onUndo: () => this.undo(),
      onRestart: () => this.restart(),
      onNextLevel: () => this.nextLevel(),
      onPrevLevel: () => this.prevLevel(),
      onMenu: () => this.onMenuRequest?.(),
      onConfirm: () => {
        if (this.status === 'won') {
          this.nextLevel();
        }
      },
    });

    this.loadProgress();
    this.loadLevel(this.levelIndex);
  }

  private loadLevel(index: number): void {
    if (index < 0 || index >= LEVELS.length) return;

    this.levelIndex = index;
    this.level = this.parseLevel(LEVELS[index]);
    this.player = { ...this.level.player };
    this.crates = this.level.crates.map(c => ({ ...c }));
    this.moves = 0;
    this.pushes = 0;
    this.undoStack = [];
    this.status = 'playing';

    this.renderer.resize(this.level.width, this.level.height);
    this.input.setCanvas(this.canvas, CELL_SIZE);
    const offset = this.renderer.getOffset();
    this.input.setScaleAndOffset(this.renderer.getScale(), offset.x, offset.y);
    this.input.setPlayerPosition(this.player.x, this.player.y);
    this.input.setEnabled(!this.replayMode);

    // Start recording if not in replay mode and not already recording
    if (!this.replayMode && !this.replay.isRecording) {
      this.replay.startRecording(index, this.dailyMode);
      this.levelsCompletedInSession = 0;
    }

    this.render();
    this.emitState();
  }

  private parseLevel(levelData: LevelData): Level {
    const lines = levelData.data.split('\n');
    const height = lines.length;
    const width = Math.max(...lines.map(l => l.length));

    const grid: Cell[][] = [];
    const crates: Position[] = [];
    const targets: Position[] = [];
    let player: Position = { x: 0, y: 0 };

    for (let y = 0; y < height; y++) {
      grid[y] = [];
      const line = lines[y] || '';

      for (let x = 0; x < width; x++) {
        const char = line[x] || ' ';

        switch (char) {
          case '#':
            grid[y][x] = 'wall';
            break;
          case '.':
            grid[y][x] = 'target';
            targets.push({ x, y });
            break;
          case '$':
            grid[y][x] = 'floor';
            crates.push({ x, y });
            break;
          case '*':
            grid[y][x] = 'target';
            targets.push({ x, y });
            crates.push({ x, y });
            break;
          case '@':
            grid[y][x] = 'floor';
            player = { x, y };
            break;
          case '+':
            grid[y][x] = 'target';
            targets.push({ x, y });
            player = { x, y };
            break;
          default:
            grid[y][x] = 'floor';
        }
      }
    }

    return {
      name: levelData.name,
      grid,
      width,
      height,
      player,
      crates,
      targets,
    };
  }

  private move(direction: Direction): void {
    if (this.status !== 'playing' || this.renderer.isAnimating()) return;
    if (this.replayMode) return; // Ignore input during replay playback

    // Record move for replay
    if (this.replay.isRecording) {
      this.replay.recordMove(direction);
    }

    const { dx, dy } = DIRECTIONS[direction];
    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;

    if (this.isWall(targetX, targetY)) return;

    const crateIndex = this.getCrateAt(targetX, targetY);
    const playerFrom = { ...this.player };

    if (crateIndex !== -1) {
      const beyondX = targetX + dx;
      const beyondY = targetY + dy;

      if (this.isWall(beyondX, beyondY) || this.getCrateAt(beyondX, beyondY) !== -1) {
        return;
      }

      const crateFrom = { x: targetX, y: targetY };
      const crateTo = { x: beyondX, y: beyondY };

      const record: MoveRecord = {
        playerFrom,
        playerTo: { x: targetX, y: targetY },
        crateMoved: crateFrom,
        crateTo,
      };

      // Start animation
      this.input.setEnabled(false);
      this.renderer.startMoveAnimation(
        playerFrom,
        record.playerTo,
        crateFrom,
        crateTo,
        crateIndex,
        () => {
          // Complete the move after animation
          this.crates[crateIndex] = { ...crateTo };
          this.player = { ...record.playerTo };
          this.moves++;
          this.pushes++;
          this.undoStack.push(record);
          this.input.setPlayerPosition(this.player.x, this.player.y);
          this.input.setEnabled(true);
          
          // Sound effects
          Sound.play('push');
          // Check if crate landed on target
          const isOnTarget = this.level.targets.some(t => t.x === crateTo.x && t.y === crateTo.y);
          if (isOnTarget) {
            Sound.play('crateOnTarget');
          }
          
          this.render();
          this.checkWin();
          this.emitState();
        }
      );

      // Render animation frames
      this.animateMove();
    } else {
      const record: MoveRecord = {
        playerFrom,
        playerTo: { x: targetX, y: targetY },
        crateMoved: null,
        crateTo: null,
      };

      this.input.setEnabled(false);
      this.renderer.startMoveAnimation(
        playerFrom,
        record.playerTo,
        null,
        null,
        -1,
        () => {
          this.player = { ...record.playerTo };
          this.moves++;
          this.undoStack.push(record);
          this.input.setPlayerPosition(this.player.x, this.player.y);
          this.input.setEnabled(true);
          Sound.play('move');
          this.render();
          this.checkWin();
          this.emitState();
        }
      );

      this.animateMove();
    }
  }

  private animateMove(): void {
    const animate = () => {
      if (this.renderer.isAnimating()) {
        this.render();
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  undo(): void {
    if (this.undoStack.length === 0 || this.renderer.isAnimating()) return;

    const record = this.undoStack.pop()!;
    this.player = { ...record.playerFrom };
    this.moves--;

    if (record.crateMoved && record.crateTo) {
      const crateIndex = this.getCrateAt(record.crateTo.x, record.crateTo.y);
      if (crateIndex !== -1) {
        this.crates[crateIndex] = { ...record.crateMoved };
        this.pushes--;
      }
    }

    Sound.play('undo');
    this.input.setPlayerPosition(this.player.x, this.player.y);
    this.render();
    this.emitState();
  }

  restart(): void {
    Sound.play('restart');
    this.loadLevel(this.levelIndex);
  }

  nextLevel(): void {
    if (this.dailyMode) {
      // In daily mode, advance to next daily level
      this.dailyTotalMoves += this.moves;
      this.dailyTotalPushes += this.pushes;
      this.dailyLevelIndex++;
      
      if (this.dailyLevelIndex < this.dailyLevels.length) {
        this.loadLevel(this.dailyLevels[this.dailyLevelIndex]);
      } else {
        // Daily complete
        this.dailyComplete = true;
        const timeSeconds = Math.floor((Date.now() - this.dailyStartTime) / 1000);
        const shareCode = generateShareCode(todayString(), this.dailyTotalMoves, this.dailyLevels.length);
        
        // Record to leaderboard (prompt for name in UI)
        this.onDailyComplete?.({
          rank: null,
          totalMoves: this.dailyTotalMoves,
          totalPushes: this.dailyTotalPushes,
          levelsCompleted: this.dailyLevels.length,
          timeSeconds,
          shareCode,
        });
      }
    } else if (this.levelIndex < LEVELS.length - 1) {
      this.loadLevel(this.levelIndex + 1);
      this.saveProgress();
    }
  }

  /** Start a daily challenge */
  startDaily(): void {
    this.dailyMode = true;
    this.dailyLevels = getDailyLevelIds(LEVELS.length);
    this.dailyLevelIndex = 0;
    this.dailyTotalMoves = 0;
    this.dailyTotalPushes = 0;
    this.dailyStartTime = Date.now();
    this.dailyComplete = false;
    
    this.loadLevel(this.dailyLevels[0]);
  }

  /** Exit daily mode */
  exitDaily(): void {
    this.dailyMode = false;
    this.dailyLevels = [];
    this.dailyLevelIndex = 0;
    this.dailyTotalMoves = 0;
    this.dailyTotalPushes = 0;
    this.dailyComplete = false;
    
    this.loadLevel(this.levelIndex);
  }

  /** Submit daily score with name */
  submitDailyScore(name: string): number | null {
    const timeSeconds = Math.floor((Date.now() - this.dailyStartTime) / 1000);
    return DailyLeaderboard.recordScore(
      name,
      this.dailyTotalMoves,
      this.dailyTotalPushes,
      this.dailyLevels.length,
      timeSeconds
    );
  }

  /** Check if in daily mode */
  isDailyMode(): boolean {
    return this.dailyMode;
  }

  /** Get daily progress */
  getDailyProgress(): { current: number; total: number; moves: number; pushes: number } {
    return {
      current: this.dailyLevelIndex + 1,
      total: this.dailyLevels.length,
      moves: this.dailyTotalMoves + this.moves,
      pushes: this.dailyTotalPushes + this.pushes,
    };
  }

  prevLevel(): void {
    if (this.levelIndex > 0) {
      this.loadLevel(this.levelIndex - 1);
    }
  }

  goToLevel(index: number): void {
    if (index >= 0 && index < LEVELS.length) {
      this.loadLevel(index);
    }
  }

  private isWall(x: number, y: number): boolean {
    if (x < 0 || y < 0 || y >= this.level.height || x >= this.level.width) {
      return true;
    }
    return this.level.grid[y][x] === 'wall';
  }

  private getCrateAt(x: number, y: number): number {
    return this.crates.findIndex(c => c.x === x && c.y === y);
  }

  private checkWin(): void {
    const allOnTarget = this.level.targets.every(target =>
      this.crates.some(crate => crate.x === target.x && crate.y === target.y)
    );

    if (allOnTarget) {
      this.status = 'won';
      this.levelsCompletedInSession++;
      Sound.play('levelComplete');
      this.saveProgress();
      
      // Stop recording and emit game over with replay data (non-daily mode)
      if (!this.dailyMode && !this.replayMode && this.replay.isRecording) {
        const totalMoves = this.moves;
        const totalPushes = this.pushes;
        const data = this.replay.stopRecording(totalMoves, totalPushes, this.levelsCompletedInSession);
        this.onGameOver?.(data);
      }
    }
  }

  private render(): void {
    this.renderer.render(this.level, this.player, this.crates, this.status);
  }

  getState(): GameState {
    const state: GameState = {
      levelIndex: this.levelIndex,
      levelName: this.level.name,
      grid: this.level.grid,
      width: this.level.width,
      height: this.level.height,
      player: { ...this.player },
      crates: this.crates.map(c => ({ ...c })),
      targets: this.level.targets.map(t => ({ ...t })),
      moves: this.moves,
      pushes: this.pushes,
      undoStack: [...this.undoStack],
      status: this.status,
      dailyMode: this.dailyMode,
    };

    if (this.dailyMode) {
      state.dailyProgress = {
        current: this.dailyLevelIndex + 1,
        total: this.dailyLevels.length,
        totalMoves: this.dailyTotalMoves + this.moves,
        totalPushes: this.dailyTotalPushes + this.pushes,
      };
    }

    return state;
  }

  getCompletedLevels(): number[] {
    return [...this.completedLevels];
  }

  private emitState(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const progress: Progress = JSON.parse(saved);
        this.levelIndex = progress.currentLevel || 0;
        this.completedLevels = progress.completedLevels || [];
        this.bestSolutions = progress.bestSolutions || {};
      }
    } catch {
      // Ignore errors
    }
  }

  private saveProgress(): void {
    try {
      const progress: Progress = {
        currentLevel: this.levelIndex,
        completedLevels: this.completedLevels,
        bestSolutions: this.bestSolutions,
      };

      if (this.status === 'won') {
        if (!progress.completedLevels.includes(this.levelIndex)) {
          progress.completedLevels.push(this.levelIndex);
          this.completedLevels = progress.completedLevels;
        }

        const best = progress.bestSolutions[this.levelIndex];
        if (!best || this.moves < best.moves || (this.moves === best.moves && this.pushes < best.pushes)) {
          progress.bestSolutions[this.levelIndex] = {
            moves: this.moves,
            pushes: this.pushes,
          };
          this.bestSolutions = progress.bestSolutions;
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore errors
    }
  }

  getLevelCount(): number {
    return LEVELS.length;
  }

  toggleSound(): boolean {
    const newState = !Sound.isEnabled();
    Sound.setEnabled(newState);
    return newState;
  }

  isSoundEnabled(): boolean {
    return Sound.isEnabled();
  }

  // Replay playback methods

  /** Start playing a replay */
  startReplay(data: ReplayData): void {
    this.replayMode = true;
    this.replayData = data;
    this.levelsCompletedInSession = 0;
    
    // Load starting level
    this.loadLevel(data.levelIndex);
    
    // Disable input during replay
    this.input.setEnabled(false);
    
    // Start playback
    this.replay.startPlayback(data);
    this.runReplayLoop();
  }

  /** Stop replay playback */
  stopReplay(): void {
    if (this.replayAnimationId !== null) {
      cancelAnimationFrame(this.replayAnimationId);
      this.replayAnimationId = null;
    }
    this.replay.stopPlayback();
    this.replayMode = false;
    this.replayData = null;
    this.input.setEnabled(true);
  }

  /** Check if in replay mode */
  isReplayMode(): boolean {
    return this.replayMode;
  }

  /** Get replay playback progress (0-1) */
  getReplayProgress(): number {
    return this.replay.playbackProgress;
  }

  /** Run the replay playback loop */
  private runReplayLoop(): void {
    const tick = () => {
      if (!this.replayMode) return;
      
      // Check for next action
      const direction = this.replay.getNextAction();
      if (direction) {
        this.executeMove(direction);
      }
      
      // Check if playback complete
      if (this.replay.isPlaybackComplete) {
        // Give a moment for final animation
        setTimeout(() => {
          if (this.replayMode) {
            this.stopReplay();
            this.emitState();
          }
        }, 500);
        return;
      }
      
      this.replayAnimationId = requestAnimationFrame(tick);
    };
    
    this.replayAnimationId = requestAnimationFrame(tick);
  }

  /** Execute a move direction (used by replay playback) */
  private executeMove(direction: Direction): void {
    if (this.status !== 'playing' || this.renderer.isAnimating()) return;

    const { dx, dy } = DIRECTIONS[direction];
    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;

    if (this.isWall(targetX, targetY)) return;

    const crateIndex = this.getCrateAt(targetX, targetY);
    const playerFrom = { ...this.player };

    if (crateIndex !== -1) {
      const beyondX = targetX + dx;
      const beyondY = targetY + dy;

      if (this.isWall(beyondX, beyondY) || this.getCrateAt(beyondX, beyondY) !== -1) {
        return;
      }

      const crateFrom = { x: targetX, y: targetY };
      const crateTo = { x: beyondX, y: beyondY };

      const record: MoveRecord = {
        playerFrom,
        playerTo: { x: targetX, y: targetY },
        crateMoved: crateFrom,
        crateTo,
      };

      this.renderer.startMoveAnimation(
        playerFrom,
        record.playerTo,
        crateFrom,
        crateTo,
        crateIndex,
        () => {
          this.crates[crateIndex] = { ...crateTo };
          this.player = { ...record.playerTo };
          this.moves++;
          this.pushes++;
          this.undoStack.push(record);
          this.input.setPlayerPosition(this.player.x, this.player.y);
          
          Sound.play('push');
          const isOnTarget = this.level.targets.some(t => t.x === crateTo.x && t.y === crateTo.y);
          if (isOnTarget) {
            Sound.play('crateOnTarget');
          }
          
          this.render();
          this.checkWin();
          this.emitState();
        }
      );

      this.animateMove();
    } else {
      const record: MoveRecord = {
        playerFrom,
        playerTo: { x: targetX, y: targetY },
        crateMoved: null,
        crateTo: null,
      };

      this.renderer.startMoveAnimation(
        playerFrom,
        record.playerTo,
        null,
        null,
        -1,
        () => {
          this.player = { ...record.playerTo };
          this.moves++;
          this.undoStack.push(record);
          this.input.setPlayerPosition(this.player.x, this.player.y);
          Sound.play('move');
          this.render();
          this.checkWin();
          this.emitState();
        }
      );

      this.animateMove();
    }
  }

  destroy(): void {
    if (this.replayAnimationId !== null) {
      cancelAnimationFrame(this.replayAnimationId);
    }
    this.input.destroy();
  }
}
