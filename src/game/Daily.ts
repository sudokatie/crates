/**
 * Daily Challenge System for Crates
 *
 * Provides date-based seeded gameplay for competitive daily runs.
 */

/** Seeded random number generator using mulberry32 algorithm */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Get next random number between 0 and 1 */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Get random integer in range [min, max) */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** Pick random item from array */
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length)];
  }

  /** Shuffle array in place */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/** Get today's date as YYYY-MM-DD string */
export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Generate a seed from a date string */
export function seedForDate(dateStr: string): number {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 0;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Combine with prime multipliers for good distribution
  return Math.abs((year * 31337 + month * 1337 + day * 37) | 0);
}

/** Get seed for today's daily challenge */
export function todaySeed(): number {
  return seedForDate(todayString());
}

/** Daily high score entry - for Sokoban, fewer moves is better */
export interface DailyScore {
  name: string;
  totalMoves: number;
  totalPushes: number;
  levelsCompleted: number;
  timeSeconds: number;
  completedAt: string;
}

const DAILY_STORAGE_KEY = 'crates_daily_leaderboard';
const MAX_DAILY_ENTRIES = 10;

/** Daily leaderboard - separate from regular high scores */
export class DailyLeaderboard {
  private static cache: Map<string, DailyScore[]> = new Map();

  private static loadForDate(date: string): DailyScore[] {
    if (this.cache.has(date)) return this.cache.get(date)!;

    if (typeof window === 'undefined') {
      this.cache.set(date, []);
      return [];
    }

    try {
      const stored = localStorage.getItem(DAILY_STORAGE_KEY);
      if (!stored) {
        this.cache.set(date, []);
        return [];
      }
      const all: Record<string, DailyScore[]> = JSON.parse(stored);
      const entries = all[date] || [];
      this.cache.set(date, entries);
      return entries;
    } catch {
      this.cache.set(date, []);
      return [];
    }
  }

  private static saveForDate(date: string, entries: DailyScore[]): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(DAILY_STORAGE_KEY);
      const all: Record<string, DailyScore[]> = stored ? JSON.parse(stored) : {};
      all[date] = entries;

      // Prune old dates (keep last 30 days)
      const dates = Object.keys(all).sort().reverse();
      if (dates.length > 30) {
        for (const oldDate of dates.slice(30)) {
          delete all[oldDate];
        }
      }

      localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(all));
    } catch {}
  }

  /** Record a score for today's challenge - lower moves is better */
  static recordScore(
    name: string,
    totalMoves: number,
    totalPushes: number,
    levelsCompleted: number,
    timeSeconds: number
  ): number | null {
    const date = todayString();
    const entries = this.loadForDate(date);
    const now = new Date().toISOString();

    entries.push({ name, totalMoves, totalPushes, levelsCompleted, timeSeconds, completedAt: now });
    
    // Sort: more levels completed first, then fewer moves, then fewer pushes
    entries.sort((a, b) => {
      if (b.levelsCompleted !== a.levelsCompleted) {
        return b.levelsCompleted - a.levelsCompleted;
      }
      if (a.totalMoves !== b.totalMoves) {
        return a.totalMoves - b.totalMoves;
      }
      return a.totalPushes - b.totalPushes;
    });

    const rank = entries.findIndex((e) => e.completedAt === now);
    const trimmed = entries.slice(0, MAX_DAILY_ENTRIES);
    this.cache.set(date, trimmed);
    this.saveForDate(date, trimmed);

    return rank >= 0 && rank < MAX_DAILY_ENTRIES ? rank + 1 : null;
  }

  /** Get today's leaderboard */
  static getToday(): DailyScore[] {
    return this.loadForDate(todayString());
  }

  /** Get leaderboard for a specific date */
  static getForDate(date: string): DailyScore[] {
    return this.loadForDate(date);
  }

  /** Check if a result would rank on today's board */
  static wouldRank(levelsCompleted: number, totalMoves: number): boolean {
    const entries = this.getToday();
    if (entries.length < MAX_DAILY_ENTRIES) return true;
    
    const worst = entries[entries.length - 1];
    if (levelsCompleted > worst.levelsCompleted) return true;
    if (levelsCompleted === worst.levelsCompleted && totalMoves < worst.totalMoves) return true;
    return false;
  }

  /** Get best score for today */
  static getBest(): DailyScore | null {
    return this.getToday()[0] || null;
  }

  /** Clear cache (for testing) */
  static resetCache(): void {
    this.cache.clear();
  }
}

/** Generate a shareable code for a daily score */
export function generateShareCode(date: string, moves: number, levels: number): string {
  const dateCompact = date.replace(/-/g, '');
  return `CRATES-${dateCompact}-${levels}L-${moves}M`;
}

/** Parse a share code */
export function parseShareCode(code: string): { date: string; moves: number; levels: number } | null {
  const parts = code.split('-');
  if (parts.length !== 4 || parts[0] !== 'CRATES') return null;

  const dateCompact = parts[1];
  if (dateCompact.length !== 8) return null;

  const year = dateCompact.slice(0, 4);
  const month = dateCompact.slice(4, 6);
  const day = dateCompact.slice(6, 8);
  const date = `${year}-${month}-${day}`;

  const levelsStr = parts[2];
  if (!levelsStr.endsWith('L')) return null;
  const levels = parseInt(levelsStr.slice(0, -1), 10);
  if (isNaN(levels)) return null;

  const movesStr = parts[3];
  if (!movesStr.endsWith('M')) return null;
  const moves = parseInt(movesStr.slice(0, -1), 10);
  if (isNaN(moves)) return null;

  return { date, moves, levels };
}

/**
 * Select levels for today's daily challenge.
 * The daily has 3 levels, selected from available levels.
 */
export function getDailyLevelIds(totalLevels: number): number[] {
  const rng = new SeededRNG(todaySeed());
  
  // Create array of level IDs (0 to totalLevels-1)
  const allLevels = Array.from({ length: totalLevels }, (_, i) => i);
  
  // Shuffle and pick 3 (or fewer if not enough levels)
  rng.shuffle(allLevels);
  return allLevels.slice(0, Math.min(3, totalLevels));
}
