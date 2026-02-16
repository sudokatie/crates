/**
 * Leaderboard - Per-level best scores with player names
 */

export interface LevelScore {
  name: string;
  moves: number;
  pushes: number;
  completedAt: string; // ISO date
}

export interface LeaderboardData {
  [levelIndex: number]: LevelScore[];
}

const STORAGE_KEY = 'crates_leaderboard';
const MAX_SCORES_PER_LEVEL = 5;

export class Leaderboard {
  private static data: LeaderboardData | null = null;

  /**
   * Load leaderboard from localStorage
   */
  static load(): LeaderboardData {
    if (this.data !== null) {
      return this.data;
    }

    if (typeof window === 'undefined') {
      this.data = {};
      return this.data;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = {};
      }
    } catch {
      this.data = {};
    }

    return this.data;
  }

  /**
   * Save leaderboard to localStorage
   */
  private static save(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // localStorage may be full or unavailable
    }
  }

  /**
   * Record a level completion
   * Returns rank (1-indexed) if made leaderboard, null otherwise
   */
  static recordScore(
    levelIndex: number,
    playerName: string,
    moves: number,
    pushes: number
  ): number | null {
    const data = this.load();
    const now = new Date().toISOString();

    if (!data[levelIndex]) {
      data[levelIndex] = [];
    }

    const scores = data[levelIndex];

    // Create new score entry
    const newScore: LevelScore = {
      name: playerName,
      moves,
      pushes,
      completedAt: now,
    };

    // Add to list
    scores.push(newScore);

    // Sort by moves (primary), then pushes (secondary)
    scores.sort((a, b) => {
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.pushes - b.pushes;
    });

    // Find rank of new score
    const rank = scores.findIndex(
      s => s.name === playerName && s.completedAt === now
    );

    // Keep only top scores
    data[levelIndex] = scores.slice(0, MAX_SCORES_PER_LEVEL);
    this.data = data;
    this.save();

    // Return rank if still in top scores, null if cut off
    if (rank >= 0 && rank < MAX_SCORES_PER_LEVEL) {
      return rank + 1;
    }
    return null;
  }

  /**
   * Get best scores for a level
   */
  static getLevelScores(levelIndex: number): LevelScore[] {
    const data = this.load();
    return data[levelIndex] || [];
  }

  /**
   * Get the best score for a level (rank 1)
   */
  static getBestScore(levelIndex: number): LevelScore | null {
    const scores = this.getLevelScores(levelIndex);
    return scores[0] || null;
  }

  /**
   * Check if a score would make the leaderboard
   */
  static wouldRank(levelIndex: number, moves: number, pushes: number): boolean {
    const scores = this.getLevelScores(levelIndex);
    
    if (scores.length < MAX_SCORES_PER_LEVEL) {
      return true;
    }

    const worst = scores[scores.length - 1];
    if (moves < worst.moves) return true;
    if (moves === worst.moves && pushes < worst.pushes) return true;
    return false;
  }

  /**
   * Get total stars (levels with any score)
   */
  static getTotalLevelsCompleted(): number {
    const data = this.load();
    return Object.keys(data).length;
  }

  /**
   * Clear all leaderboard data
   */
  static clear(): void {
    this.data = {};
    this.save();
  }

  /**
   * Reset cached data (for testing)
   */
  static resetCache(): void {
    this.data = null;
  }
}
