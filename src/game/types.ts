// Crates - Type Definitions

export interface Position {
  x: number;
  y: number;
}

export type Cell = 'wall' | 'floor' | 'target';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MoveRecord {
  playerFrom: Position;
  playerTo: Position;
  crateMoved: Position | null;
  crateTo: Position | null;
}

export interface Level {
  name: string;
  grid: Cell[][];
  width: number;
  height: number;
  player: Position;
  crates: Position[];
  targets: Position[];
}

export type GameStatus = 'playing' | 'won' | 'menu';

export interface GameState {
  // Level
  levelIndex: number;
  levelName: string;

  // Grid
  grid: Cell[][];
  width: number;
  height: number;

  // Entities
  player: Position;
  crates: Position[];
  targets: Position[];

  // Stats
  moves: number;
  pushes: number;

  // History
  undoStack: MoveRecord[];

  // Status
  status: GameStatus;
}

export interface Progress {
  currentLevel: number;
  completedLevels: number[];
  bestSolutions: {
    [levelIndex: number]: {
      moves: number;
      pushes: number;
    };
  };
}
