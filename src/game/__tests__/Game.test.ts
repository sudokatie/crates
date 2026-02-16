import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock canvas and context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  getContext: vi.fn(),
};

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  width: 0,
  height: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 400, height: 400 })),
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock window.addEventListener
vi.stubGlobal('addEventListener', vi.fn());
vi.stubGlobal('removeEventListener', vi.fn());

import { Game } from '../Game';

describe('Game', () => {
  let game: Game;

  beforeEach(() => {
    vi.clearAllMocks();
    game = new Game(mockCanvas as unknown as HTMLCanvasElement);
  });

  describe('initialization', () => {
    it('should start at level 0', () => {
      const state = game.getState();
      expect(state.levelIndex).toBe(0);
    });

    it('should have playing status', () => {
      const state = game.getState();
      expect(state.status).toBe('playing');
    });

    it('should start with 0 moves', () => {
      const state = game.getState();
      expect(state.moves).toBe(0);
    });

    it('should start with 0 pushes', () => {
      const state = game.getState();
      expect(state.pushes).toBe(0);
    });

    it('should have empty undo stack', () => {
      const state = game.getState();
      expect(state.undoStack.length).toBe(0);
    });
  });

  describe('level count', () => {
    it('should have 25 levels', () => {
      expect(game.getLevelCount()).toBe(25);
    });
  });

  describe('level navigation', () => {
    it('should not go below level 0', () => {
      game.prevLevel();
      expect(game.getState().levelIndex).toBe(0);
    });

    it('should go to next level', () => {
      game.nextLevel();
      expect(game.getState().levelIndex).toBe(1);
    });

    it('should go to specific level', () => {
      game.goToLevel(5);
      expect(game.getState().levelIndex).toBe(5);
    });

    it('should not go beyond last level', () => {
      game.goToLevel(24);
      game.nextLevel();
      expect(game.getState().levelIndex).toBe(24);
    });

    it('should reset moves when changing level', () => {
      game.nextLevel();
      expect(game.getState().moves).toBe(0);
    });
  });

  describe('restart', () => {
    it('should reset moves to 0', () => {
      // Make some moves then restart
      game.restart();
      expect(game.getState().moves).toBe(0);
    });

    it('should reset pushes to 0', () => {
      game.restart();
      expect(game.getState().pushes).toBe(0);
    });

    it('should clear undo stack', () => {
      game.restart();
      expect(game.getState().undoStack.length).toBe(0);
    });

    it('should stay on same level', () => {
      game.goToLevel(3);
      game.restart();
      expect(game.getState().levelIndex).toBe(3);
    });
  });

  describe('completed levels tracking', () => {
    it('should start with empty completed levels', () => {
      expect(game.getCompletedLevels()).toEqual([]);
    });
  });
});
