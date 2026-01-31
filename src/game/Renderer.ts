// Crates - Canvas Renderer

import { CELL_SIZE, COLORS, MOVE_DURATION_MS } from './constants';
import type { Position, Cell, Level, GameStatus } from './types';

interface AnimationState {
  active: boolean;
  startTime: number;
  playerFrom: Position;
  playerTo: Position;
  crateFrom: Position | null;
  crateTo: Position | null;
  crateIndex: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animation: AnimationState = {
    active: false,
    startTime: 0,
    playerFrom: { x: 0, y: 0 },
    playerTo: { x: 0, y: 0 },
    crateFrom: null,
    crateTo: null,
    crateIndex: -1,
  };
  private animationCallback: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width * CELL_SIZE;
    this.canvas.height = height * CELL_SIZE;
  }

  startMoveAnimation(
    playerFrom: Position,
    playerTo: Position,
    crateFrom: Position | null,
    crateTo: Position | null,
    crateIndex: number,
    onComplete: () => void
  ): void {
    this.animation = {
      active: true,
      startTime: performance.now(),
      playerFrom,
      playerTo,
      crateFrom,
      crateTo,
      crateIndex,
    };
    this.animationCallback = onComplete;
    this.animateFrame();
  }

  private animateFrame = (): void => {
    if (!this.animation.active) return;

    const elapsed = performance.now() - this.animation.startTime;
    const progress = Math.min(elapsed / MOVE_DURATION_MS, 1);

    if (progress >= 1) {
      this.animation.active = false;
      if (this.animationCallback) {
        this.animationCallback();
        this.animationCallback = null;
      }
      return;
    }

    requestAnimationFrame(this.animateFrame);
  };

  getAnimationProgress(): number {
    if (!this.animation.active) return 1;
    const elapsed = performance.now() - this.animation.startTime;
    return Math.min(elapsed / MOVE_DURATION_MS, 1);
  }

  isAnimating(): boolean {
    return this.animation.active;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 2);
  }

  render(
    level: Level,
    player: Position,
    crates: Position[],
    status: GameStatus
  ): void {
    const ctx = this.ctx;
    const progress = this.easeOut(this.getAnimationProgress());

    // Calculate display positions
    let displayPlayer = player;
    const displayCrates = [...crates];

    if (this.animation.active) {
      displayPlayer = {
        x: this.lerp(this.animation.playerFrom.x, this.animation.playerTo.x, progress),
        y: this.lerp(this.animation.playerFrom.y, this.animation.playerTo.y, progress),
      };

      if (this.animation.crateFrom && this.animation.crateTo && this.animation.crateIndex >= 0) {
        displayCrates[this.animation.crateIndex] = {
          x: this.lerp(this.animation.crateFrom.x, this.animation.crateTo.x, progress),
          y: this.lerp(this.animation.crateFrom.y, this.animation.crateTo.y, progress),
        };
      }
    }

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const cell = level.grid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell === 'wall') {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          if (cell === 'target') {
            ctx.fillStyle = COLORS.target;
            ctx.beginPath();
            ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Draw crates
    for (let i = 0; i < displayCrates.length; i++) {
      const crate = displayCrates[i];
      const actualCrate = crates[i];
      const onTarget = level.grid[Math.round(actualCrate.y)]?.[Math.round(actualCrate.x)] === 'target';
      
      ctx.fillStyle = onTarget ? COLORS.crateOnTarget : COLORS.crate;
      ctx.fillRect(
        crate.x * CELL_SIZE + 4,
        crate.y * CELL_SIZE + 4,
        CELL_SIZE - 8,
        CELL_SIZE - 8
      );

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
    const playerCell = level.grid[Math.round(player.y)]?.[Math.round(player.x)];
    const onTarget = playerCell === 'target';
    ctx.fillStyle = onTarget ? COLORS.playerOnTarget : COLORS.player;
    ctx.beginPath();
    ctx.arc(
      displayPlayer.x * CELL_SIZE + CELL_SIZE / 2,
      displayPlayer.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}
