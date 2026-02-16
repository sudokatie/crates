import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sound } from '../Sound';

describe('Sound System', () => {
  beforeEach(() => {
    // Reset Sound state
    Sound.resetContext();
    Sound.setEnabled(true);
    Sound.setVolume(0.3);
  });

  describe('singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = Sound;
      const instance2 = Sound;
      expect(instance1).toBe(instance2);
    });
  });

  describe('enabled state', () => {
    it('can be enabled and disabled', () => {
      Sound.setEnabled(false);
      expect(Sound.isEnabled()).toBe(false);

      Sound.setEnabled(true);
      expect(Sound.isEnabled()).toBe(true);
    });

    it('does not throw when playing while disabled', () => {
      Sound.setEnabled(false);
      expect(() => Sound.play('move')).not.toThrow();
    });
  });

  describe('volume control', () => {
    it('can set and get volume', () => {
      Sound.setVolume(0.5);
      expect(Sound.getVolume()).toBe(0.5);
    });

    it('clamps volume to 0-1 range', () => {
      Sound.setVolume(-0.5);
      expect(Sound.getVolume()).toBe(0);

      Sound.setVolume(1.5);
      expect(Sound.getVolume()).toBe(1);
    });
  });

  describe('sound playback', () => {
    // These tests verify the API doesn't throw - actual audio output
    // is tested manually in the browser
    it('plays move sound without error', () => {
      expect(() => Sound.play('move')).not.toThrow();
    });

    it('plays push sound without error', () => {
      expect(() => Sound.play('push')).not.toThrow();
    });

    it('plays crateOnTarget sound without error', () => {
      expect(() => Sound.play('crateOnTarget')).not.toThrow();
    });

    it('plays undo sound without error', () => {
      expect(() => Sound.play('undo')).not.toThrow();
    });

    it('plays levelComplete sound without error', () => {
      expect(() => Sound.play('levelComplete')).not.toThrow();
    });

    it('plays restart sound without error', () => {
      expect(() => Sound.play('restart')).not.toThrow();
    });
  });
});
