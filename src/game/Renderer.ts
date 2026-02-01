// Crates - Canvas Renderer

import { CELL_SIZE, COLORS, PUSH_DURATION_MS, MAX_WIDTH, MAX_HEIGHT } from './constants';
import type { Position, Level, GameStatus } from './types';

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
  private offsetX: number = 0;
  private offsetY: number = 0;
  private scale: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  resize(levelWidth: number, levelHeight: number, containerWidth?: number, containerHeight?: number): void {
    // Calculate max canvas size based on container or defaults
    const maxCanvasWidth = containerWidth ?? MAX_WIDTH * CELL_SIZE;
    const maxCanvasHeight = containerHeight ?? MAX_HEIGHT * CELL_SIZE;

    // Calculate required size for level
    const requiredWidth = levelWidth * CELL_SIZE;
    const requiredHeight = levelHeight * CELL_SIZE;

    // Calculate scale to fit within max bounds while maintaining aspect ratio
    const scaleX = maxCanvasWidth / requiredWidth;
    const scaleY = maxCanvasHeight / requiredHeight;
    this.scale = Math.min(scaleX, scaleY, 1); // Never scale up, only down

    // Set canvas to fixed viewport size for centering
    const viewportWidth = Math.min(requiredWidth, maxCanvasWidth);
    const viewportHeight = Math.min(requiredHeight, maxCanvasHeight);
    
    this.canvas.width = viewportWidth;
    this.canvas.height = viewportHeight;

    // Calculate offset to center the level
    const scaledWidth = requiredWidth * this.scale;
    const scaledHeight = requiredHeight * this.scale;
    this.offsetX = (viewportWidth - scaledWidth) / 2;
    this.offsetY = (viewportHeight - scaledHeight) / 2;
  }

  getScale(): number {
    return this.scale;
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
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
    const progress = Math.min(elapsed / PUSH_DURATION_MS, 1);

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
    return Math.min(elapsed / PUSH_DURATION_MS, 1);
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
    const cellSize = CELL_SIZE * this.scale;

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

    // Draw grid (with offset for centering)
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const cell = level.grid[y][x];
        const px = this.offsetX + x * cellSize;
        const py = this.offsetY + y * cellSize;

        if (cell === 'wall') {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, cellSize, cellSize);
        } else {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(px, py, cellSize, cellSize);

          if (cell === 'target') {
            ctx.fillStyle = COLORS.target;
            ctx.beginPath();
            ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Draw crates
    const padding = 4 * this.scale;
    for (let i = 0; i < displayCrates.length; i++) {
      const crate = displayCrates[i];
      const actualCrate = crates[i];
      const onTarget = level.grid[Math.round(actualCrate.y)]?.[Math.round(actualCrate.x)] === 'target';
      
      ctx.fillStyle = onTarget ? COLORS.crateOnTarget : COLORS.crate;
      ctx.fillRect(
        this.offsetX + crate.x * cellSize + padding,
        this.offsetY + crate.y * cellSize + padding,
        cellSize - padding * 2,
        cellSize - padding * 2
      );

      ctx.strokeStyle = onTarget ? '#3d7a3d' : '#6b5010';
      ctx.lineWidth = 2 * this.scale;
      ctx.strokeRect(
        this.offsetX + crate.x * cellSize + padding,
        this.offsetY + crate.y * cellSize + padding,
        cellSize - padding * 2,
        cellSize - padding * 2
      );
    }

    // Draw player
    const playerCell = level.grid[Math.round(player.y)]?.[Math.round(player.x)];
    const onTarget = playerCell === 'target';
    ctx.fillStyle = onTarget ? COLORS.playerOnTarget : COLORS.player;
    ctx.beginPath();
    ctx.arc(
      this.offsetX + displayPlayer.x * cellSize + cellSize / 2,
      this.offsetY + displayPlayer.y * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}
