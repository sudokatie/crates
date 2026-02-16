/**
 * @jest-environment jsdom
 */

import { Leaderboard, LevelScore } from '../Leaderboard';

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
    Leaderboard.resetCache();
  });

  describe('load', () => {
    it('should return empty object when no data exists', () => {
      const data = Leaderboard.load();
      expect(data).toEqual({});
    });

    it('should load existing data from localStorage', () => {
      const existingData = {
        0: [{ name: 'Alice', moves: 10, pushes: 5, completedAt: '2026-01-01T00:00:00Z' }],
      };
      localStorage.setItem('crates_leaderboard', JSON.stringify(existingData));
      Leaderboard.resetCache();

      const data = Leaderboard.load();
      expect(data[0]).toHaveLength(1);
      expect(data[0][0].name).toBe('Alice');
    });
  });

  describe('recordScore', () => {
    it('should add first score for a level', () => {
      const rank = Leaderboard.recordScore(0, 'Bob', 15, 8);

      expect(rank).toBe(1);
      const scores = Leaderboard.getLevelScores(0);
      expect(scores).toHaveLength(1);
      expect(scores[0].name).toBe('Bob');
      expect(scores[0].moves).toBe(15);
      expect(scores[0].pushes).toBe(8);
    });

    it('should sort scores by moves then pushes', () => {
      Leaderboard.recordScore(0, 'Slow', 20, 10);
      Leaderboard.recordScore(0, 'Fast', 10, 5);
      Leaderboard.recordScore(0, 'Medium', 15, 7);

      const scores = Leaderboard.getLevelScores(0);
      expect(scores[0].name).toBe('Fast');
      expect(scores[1].name).toBe('Medium');
      expect(scores[2].name).toBe('Slow');
    });

    it('should sort by pushes when moves are equal', () => {
      Leaderboard.recordScore(0, 'MorePushes', 10, 8);
      Leaderboard.recordScore(0, 'FewerPushes', 10, 4);

      const scores = Leaderboard.getLevelScores(0);
      expect(scores[0].name).toBe('FewerPushes');
      expect(scores[1].name).toBe('MorePushes');
    });

    it('should limit to max scores per level', () => {
      for (let i = 0; i < 10; i++) {
        Leaderboard.recordScore(0, `Player${i}`, 10 + i, 5);
      }

      const scores = Leaderboard.getLevelScores(0);
      expect(scores).toHaveLength(5); // MAX_SCORES_PER_LEVEL
    });

    it('should return null when score does not make leaderboard', () => {
      // Fill with good scores
      for (let i = 0; i < 5; i++) {
        Leaderboard.recordScore(0, `Pro${i}`, 5 + i, 3);
      }

      // Try to add a bad score
      const rank = Leaderboard.recordScore(0, 'Newbie', 100, 50);
      expect(rank).toBeNull();
    });

    it('should track scores separately per level', () => {
      Leaderboard.recordScore(0, 'Level0', 10, 5);
      Leaderboard.recordScore(1, 'Level1', 20, 10);
      Leaderboard.recordScore(2, 'Level2', 30, 15);

      expect(Leaderboard.getLevelScores(0)[0].name).toBe('Level0');
      expect(Leaderboard.getLevelScores(1)[0].name).toBe('Level1');
      expect(Leaderboard.getLevelScores(2)[0].name).toBe('Level2');
    });

    it('should persist to localStorage', () => {
      Leaderboard.recordScore(0, 'Persistent', 10, 5);

      const stored = localStorage.getItem('crates_leaderboard');
      expect(stored).not.toBeNull();
      const data = JSON.parse(stored!);
      expect(data[0][0].name).toBe('Persistent');
    });
  });

  describe('getBestScore', () => {
    it('should return best score for level', () => {
      Leaderboard.recordScore(0, 'Second', 20, 10);
      Leaderboard.recordScore(0, 'First', 10, 5);

      const best = Leaderboard.getBestScore(0);
      expect(best?.name).toBe('First');
      expect(best?.moves).toBe(10);
    });

    it('should return null for level with no scores', () => {
      expect(Leaderboard.getBestScore(99)).toBeNull();
    });
  });

  describe('wouldRank', () => {
    it('should return true when leaderboard not full', () => {
      expect(Leaderboard.wouldRank(0, 100, 50)).toBe(true);
    });

    it('should return true when score beats worst', () => {
      for (let i = 0; i < 5; i++) {
        Leaderboard.recordScore(0, `Player${i}`, 20 + i, 10);
      }

      expect(Leaderboard.wouldRank(0, 15, 5)).toBe(true);
    });

    it('should return false when score would not rank', () => {
      for (let i = 0; i < 5; i++) {
        Leaderboard.recordScore(0, `Player${i}`, 10 + i, 5);
      }

      expect(Leaderboard.wouldRank(0, 100, 50)).toBe(false);
    });
  });

  describe('getTotalLevelsCompleted', () => {
    it('should count levels with any score', () => {
      Leaderboard.recordScore(0, 'A', 10, 5);
      Leaderboard.recordScore(2, 'B', 10, 5);
      Leaderboard.recordScore(5, 'C', 10, 5);

      expect(Leaderboard.getTotalLevelsCompleted()).toBe(3);
    });
  });

  describe('clear', () => {
    it('should remove all data', () => {
      Leaderboard.recordScore(0, 'ToBeCleared', 10, 5);
      expect(Leaderboard.getLevelScores(0)).toHaveLength(1);

      Leaderboard.clear();
      expect(Leaderboard.getLevelScores(0)).toHaveLength(0);
    });
  });
});
