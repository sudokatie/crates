// Crates - Main Game Class

import { LEVELS, LevelData } from './levels';
import { CELL_SIZE, STORAGE_KEY, DIRECTIONS } from './constants';
import { Renderer } from './Renderer';
import { Input } from './Input';
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

  onStateChange?: (state: GameState) => void;
  onMenuRequest?: () => void;

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
    this.input.setEnabled(true);

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

    this.input.setPlayerPosition(this.player.x, this.player.y);
    this.render();
    this.emitState();
  }

  restart(): void {
    this.loadLevel(this.levelIndex);
  }

  nextLevel(): void {
    if (this.levelIndex < LEVELS.length - 1) {
      this.loadLevel(this.levelIndex + 1);
      this.saveProgress();
    }
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
      this.saveProgress();
    }
  }

  private render(): void {
    this.renderer.render(this.level, this.player, this.crates, this.status);
  }

  getState(): GameState {
    return {
      levelIndex: this.levelIndex,
      level: this.level,
      player: { ...this.player },
      crates: this.crates.map(c => ({ ...c })),
      moves: this.moves,
      pushes: this.pushes,
      undoStack: [...this.undoStack],
      status: this.status,
    };
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

  destroy(): void {
    this.input.destroy();
  }
}
