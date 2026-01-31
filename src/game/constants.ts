// Crates - Game Constants

export const CELL_SIZE = 40;
export const MAX_WIDTH = 20;
export const MAX_HEIGHT = 16;

export const COLORS = {
  background: '#2d2d2d',
  floor: '#3d3d3d',
  wall: '#1a1a1a',
  target: '#4a9c4a',
  targetDot: '#90ee90',
  crate: '#8b6914',
  crateOnTarget: '#5a9c5a',
  player: '#4169e1',
  playerOnTarget: '#6a89f1',
  text: '#ffffff',
  textMuted: '#888888',
};

export const MOVE_DURATION_MS = 80;

export const STORAGE_KEY = 'crates_progress';

// Direction vectors
export const DIRECTIONS: Record<string, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};
