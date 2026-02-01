// Crates - Input Handler

import type { Direction } from './types';

export type InputCallback = (direction: Direction) => void;
export type ActionCallback = () => void;

export interface InputCallbacks {
  onMove: InputCallback;
  onUndo: ActionCallback;
  onRestart: ActionCallback;
  onNextLevel: ActionCallback;
  onPrevLevel: ActionCallback;
  onMenu: ActionCallback;
  onConfirm: ActionCallback;
}

const SWIPE_THRESHOLD = 30; // Minimum distance for swipe detection

export class Input {
  private callbacks: InputCallbacks;
  private enabled: boolean = true;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleClick: (e: MouseEvent) => void;
  private boundHandleTouchStart: (e: TouchEvent) => void;
  private boundHandleTouchEnd: (e: TouchEvent) => void;
  private canvas: HTMLCanvasElement | null = null;
  private cellSize: number = 40;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private playerPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchStart: { x: number; y: number } | null = null;

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    window.addEventListener('keydown', this.boundHandleKeyDown);
  }

  setCanvas(canvas: HTMLCanvasElement, cellSize: number): void {
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
      this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart);
      this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
    }
    this.canvas = canvas;
    this.cellSize = cellSize;
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    this.canvas.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });
  }

  setPlayerPosition(x: number, y: number): void {
    this.playerPos = { x, y };
  }

  setScaleAndOffset(scale: number, offsetX: number, offsetY: number): void {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private handleKeyDown(e: KeyboardEvent): void {
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
        this.callbacks.onUndo();
        return;
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          this.callbacks.onUndo();
        }
        return;
      case 'r':
      case 'R':
        this.callbacks.onRestart();
        return;
      case 'n':
      case 'N':
        this.callbacks.onNextLevel();
        return;
      case 'p':
      case 'P':
        this.callbacks.onPrevLevel();
        return;
      case 'Escape':
        this.callbacks.onMenu();
        return;
      case ' ':
      case 'Enter':
        this.callbacks.onConfirm();
        return;
    }

    if (direction && this.enabled) {
      e.preventDefault();
      this.callbacks.onMove(direction);
    }
  }

  private handleClick(e: MouseEvent): void {
    if (!this.enabled || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const displayScale = this.canvas.width / rect.width;
    
    // Get click position in canvas coordinates
    const canvasX = (e.clientX - rect.left) * displayScale;
    const canvasY = (e.clientY - rect.top) * displayScale;
    
    // Account for centering offset and scale
    const scaledCellSize = this.cellSize * this.scale;
    const clickX = Math.floor((canvasX - this.offsetX) / scaledCellSize);
    const clickY = Math.floor((canvasY - this.offsetY) / scaledCellSize);

    const dx = clickX - this.playerPos.x;
    const dy = clickY - this.playerPos.y;

    // Only move to adjacent cells
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;

    let direction: Direction | null = null;
    if (dx === 1) direction = 'right';
    else if (dx === -1) direction = 'left';
    else if (dy === 1) direction = 'down';
    else if (dy === -1) direction = 'up';

    if (direction) {
      this.callbacks.onMove(direction);
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    if (!this.enabled || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY };
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.enabled || !this.touchStart) return;
    
    if (e.changedTouches.length !== 1) {
      this.touchStart = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStart.x;
    const dy = touch.clientY - this.touchStart.y;
    this.touchStart = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Need minimum swipe distance
    if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

    e.preventDefault();

    let direction: Direction | null = null;

    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    if (direction) {
      this.callbacks.onMove(direction);
    }
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
      this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart);
      this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
    }
  }
}
