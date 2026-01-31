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

export class Input {
  private callbacks: InputCallbacks;
  private enabled: boolean = true;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleClick: (e: MouseEvent) => void;
  private canvas: HTMLCanvasElement | null = null;
  private cellSize: number = 40;
  private playerPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
    window.addEventListener('keydown', this.boundHandleKeyDown);
  }

  setCanvas(canvas: HTMLCanvasElement, cellSize: number): void {
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
    }
    this.canvas = canvas;
    this.cellSize = cellSize;
    this.canvas.addEventListener('click', this.boundHandleClick);
  }

  setPlayerPosition(x: number, y: number): void {
    this.playerPos = { x, y };
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
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const clickX = Math.floor((e.clientX - rect.left) * scaleX / this.cellSize);
    const clickY = Math.floor((e.clientY - rect.top) * scaleY / this.cellSize);

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

  destroy(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
    }
  }
}
