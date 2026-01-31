// Crates - Main Game Class

import { LEVELS, LevelData } from './levels';
import { CELL_SIZE, COLORS, DIRECTIONS, STORAGE_KEY } from './constants';
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
  private ctx: CanvasRenderingContext2D;

  private levelIndex: number = 0;
  private level!: Level;
  private player!: Position;
  private crates: Position[] = [];
  private moves: number = 0;
  private pushes: number = 0;
  private undoStack: MoveRecord[] = [];
  private status: GameStatus = 'playing';

  onStateChange?: (state: GameState) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.loadProgress();
    this.loadLevel(this.levelIndex);
    this.setupInput();
    this.render();
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

    // Resize canvas to fit level
    this.canvas.width = this.level.width * CELL_SIZE;
    this.canvas.height = this.level.height * CELL_SIZE;

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

  private setupInput(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.status !== 'playing') {
      if (e.key === ' ' || e.key === 'Enter') {
        if (this.status === 'won') {
          this.nextLevel();
        }
      }
      return;
    }

    let direction: Direction | null = null;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'right';
        break;
      case 'u':
      case 'U':
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.key === 'u' || e.key === 'U') {
          this.undo();
        }
        break;
      case 'r':
      case 'R':
        this.restart();
        break;
      case 'n':
      case 'N':
        this.nextLevel();
        break;
      case 'p':
      case 'P':
        this.prevLevel();
        break;
    }

    if (direction) {
      e.preventDefault();
      this.move(direction);
    }
  }

  private move(direction: Direction): void {
    const { dx, dy } = DIRECTIONS[direction];
    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;

    // Check if target is wall
    if (this.isWall(targetX, targetY)) return;

    // Check if target has crate
    const crateIndex = this.getCrateAt(targetX, targetY);

    if (crateIndex !== -1) {
      // Try to push crate
      const beyondX = targetX + dx;
      const beyondY = targetY + dy;

      if (this.isWall(beyondX, beyondY) || this.getCrateAt(beyondX, beyondY) !== -1) {
        return; // Can't push
      }

      // Push the crate
      const record: MoveRecord = {
        playerFrom: { ...this.player },
        playerTo: { x: targetX, y: targetY },
        crateMoved: { x: targetX, y: targetY },
        crateTo: { x: beyondX, y: beyondY },
      };

      this.crates[crateIndex] = { x: beyondX, y: beyondY };
      this.player = { x: targetX, y: targetY };
      this.moves++;
      this.pushes++;
      this.undoStack.push(record);
    } else {
      // Just move player
      const record: MoveRecord = {
        playerFrom: { ...this.player },
        playerTo: { x: targetX, y: targetY },
        crateMoved: null,
        crateTo: null,
      };

      this.player = { x: targetX, y: targetY };
      this.moves++;
      this.undoStack.push(record);
    }

    this.render();
    this.checkWin();
    this.emitState();
  }

  private undo(): void {
    if (this.undoStack.length === 0) return;

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

  private isTarget(x: number, y: number): boolean {
    return this.level.grid[y]?.[x] === 'target';
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
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    for (let y = 0; y < this.level.height; y++) {
      for (let x = 0; x < this.level.width; x++) {
        const cell = this.level.grid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell === 'wall') {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          if (cell === 'target') {
            // Draw target marker
            ctx.fillStyle = COLORS.target;
            ctx.beginPath();
            ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Draw crates
    for (const crate of this.crates) {
      const onTarget = this.isTarget(crate.x, crate.y);
      ctx.fillStyle = onTarget ? COLORS.crateOnTarget : COLORS.crate;
      ctx.fillRect(
        crate.x * CELL_SIZE + 4,
        crate.y * CELL_SIZE + 4,
        CELL_SIZE - 8,
        CELL_SIZE - 8
      );

      // Crate border
      ctx.strokeStyle = onTarget ? '#3d7a3d' : '#6b5010';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        crate.x * CELL_SIZE + 4,
        crate.y * CELL_SIZE + 4,
        CELL_SIZE - 8,
        CELL_SIZE - 8
      );
    }

    // Draw player
    const onTarget = this.isTarget(this.player.x, this.player.y);
    ctx.fillStyle = onTarget ? COLORS.playerOnTarget : COLORS.player;
    ctx.beginPath();
    ctx.arc(
      this.player.x * CELL_SIZE + CELL_SIZE / 2,
      this.player.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
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
      }
    } catch {
      // Ignore errors
    }
  }

  private saveProgress(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const progress: Progress = saved ? JSON.parse(saved) : {
        currentLevel: 0,
        completedLevels: [],
        bestSolutions: {},
      };

      progress.currentLevel = this.levelIndex;

      if (this.status === 'won') {
        if (!progress.completedLevels.includes(this.levelIndex)) {
          progress.completedLevels.push(this.levelIndex);
        }

        const best = progress.bestSolutions[this.levelIndex];
        if (!best || this.moves < best.moves || (this.moves === best.moves && this.pushes < best.pushes)) {
          progress.bestSolutions[this.levelIndex] = {
            moves: this.moves,
            pushes: this.pushes,
          };
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
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}
