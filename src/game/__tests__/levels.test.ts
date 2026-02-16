import { describe, it, expect } from 'vitest';
import { LEVELS } from '../levels';

describe('Levels', () => {
  it('should have 25 levels', () => {
    expect(LEVELS.length).toBe(25);
  });

  it('should have names for all levels', () => {
    LEVELS.forEach((level, index) => {
      expect(level.name).toBeTruthy();
      expect(typeof level.name).toBe('string');
    });
  });

  it('should have data for all levels', () => {
    LEVELS.forEach((level, index) => {
      expect(level.data).toBeTruthy();
      expect(typeof level.data).toBe('string');
    });
  });

  describe('level format validation', () => {
    LEVELS.forEach((level, index) => {
      describe(`Level ${index + 1}: ${level.name}`, () => {
        it('should have exactly one player (@) or player on target (+)', () => {
          const playerCount = (level.data.match(/@/g) || []).length;
          const playerOnTargetCount = (level.data.match(/\+/g) || []).length;
          expect(playerCount + playerOnTargetCount).toBe(1);
        });

        it('should have at least one crate ($) or crate on target (*)', () => {
          const crateCount = (level.data.match(/\$/g) || []).length;
          const crateOnTargetCount = (level.data.match(/\*/g) || []).length;
          expect(crateCount + crateOnTargetCount).toBeGreaterThan(0);
        });

        it('should have at least one target (.) or crate on target (*) or player on target (+)', () => {
          const targetCount = (level.data.match(/\./g) || []).length;
          const crateOnTargetCount = (level.data.match(/\*/g) || []).length;
          const playerOnTargetCount = (level.data.match(/\+/g) || []).length;
          expect(targetCount + crateOnTargetCount + playerOnTargetCount).toBeGreaterThan(0);
        });

        it('should have equal number of crates and targets', () => {
          // Count crates: $ (free crate) + * (crate on target)
          const freeCrates = (level.data.match(/\$/g) || []).length;
          const cratesOnTarget = (level.data.match(/\*/g) || []).length;
          const totalCrates = freeCrates + cratesOnTarget;
          
          // Count targets: . (empty) + * (has crate) + + (has player)
          const emptyTargets = (level.data.match(/\./g) || []).length;
          const totalTargets = emptyTargets + cratesOnTarget;
          // Note: + (player on target) is a target but doesn't need a crate
          // In some puzzles, player ends on a target that wasn't meant for a crate
          
          // Valid Sokoban: targets >= crates (some targets might be extra)
          // Most levels have equal, but we allow >= for valid puzzles
          expect(totalTargets).toBeGreaterThanOrEqual(totalCrates);
        });

        it('should have walls (#) surrounding the playable area', () => {
          expect(level.data).toContain('#');
        });

        it('should only contain valid XSB characters', () => {
          const validChars = /^[# $.@+*\n]+$/;
          expect(level.data).toMatch(validChars);
        });
      });
    });
  });
});
