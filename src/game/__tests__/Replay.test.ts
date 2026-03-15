import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Replay, ReplayData, ReplayFrame } from '../Replay';

describe('Replay', () => {
  let replay: Replay;

  beforeEach(() => {
    replay = new Replay();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('recording', () => {
    it('should start and stop recording', () => {
      replay.startRecording(0, false);
      expect(replay.isRecording).toBe(true);

      const data = replay.stopRecording(10, 5, 1);
      expect(replay.isRecording).toBe(false);
      expect(data.finalMoves).toBe(10);
      expect(data.finalPushes).toBe(5);
      expect(data.levelsCompleted).toBe(1);
    });

    it('should record moves with timestamps', () => {
      replay.startRecording(0, false);

      replay.recordMove('up');
      vi.advanceTimersByTime(100);
      replay.recordMove('right');
      vi.advanceTimersByTime(200);
      replay.recordMove('down');

      const data = replay.stopRecording(3, 0, 1);
      expect(data.frames).toHaveLength(3);
      expect(data.frames[0].direction).toBe('up');
      expect(data.frames[1].direction).toBe('right');
      expect(data.frames[2].direction).toBe('down');
    });

    it('should not record moves when not recording', () => {
      replay.recordMove('up');
      replay.recordMove('down');

      replay.startRecording(0, false);
      const data = replay.stopRecording(0, 0, 0);
      expect(data.frames).toHaveLength(0);
    });

    it('should store level index and daily mode', () => {
      replay.startRecording(5, true);
      const data = replay.stopRecording(0, 0, 0);

      expect(data.levelIndex).toBe(5);
      expect(data.dailyMode).toBe(true);
    });
  });

  describe('playback', () => {
    const testData: ReplayData = {
      version: 1,
      levelIndex: 0,
      timestamp: Date.now(),
      duration: 500,
      frames: [
        { time: 0, direction: 'up' },
        { time: 100, direction: 'right' },
        { time: 200, direction: 'down' },
        { time: 300, direction: 'left' },
      ],
      finalMoves: 4,
      finalPushes: 2,
      levelsCompleted: 1,
      dailyMode: false,
    };

    it('should start playback', () => {
      replay.startPlayback(testData);
      expect(replay.isPlaying).toBe(true);
      expect(replay.playbackProgress).toBe(0);
    });

    it('should return actions at correct times', () => {
      replay.startPlayback(testData);

      // First frame should be immediate
      expect(replay.getNextAction()).toBe('up');
      expect(replay.playbackProgress).toBe(0.25);

      // Second frame at 100ms
      expect(replay.getNextAction()).toBe(null);
      vi.advanceTimersByTime(100);
      expect(replay.getNextAction()).toBe('right');

      // Third frame at 200ms
      vi.advanceTimersByTime(100);
      expect(replay.getNextAction()).toBe('down');

      // Fourth frame at 300ms
      vi.advanceTimersByTime(100);
      expect(replay.getNextAction()).toBe('left');
      expect(replay.playbackProgress).toBe(1);
    });

    it('should detect playback complete', () => {
      replay.startPlayback(testData);

      for (let i = 0; i < 4; i++) {
        vi.advanceTimersByTime(100);
        replay.getNextAction();
      }

      expect(replay.isPlaybackComplete).toBe(true);
    });

    it('should stop playback', () => {
      replay.startPlayback(testData);
      replay.stopPlayback();

      expect(replay.isPlaying).toBe(false);
      expect(replay.playbackProgress).toBe(0);
    });

    it('should expose level index and daily mode during playback', () => {
      const dailyData = { ...testData, levelIndex: 3, dailyMode: true };
      replay.startPlayback(dailyData);

      expect(replay.levelIndex).toBe(3);
      expect(replay.dailyMode).toBe(true);
    });
  });

  describe('encode/decode', () => {
    const testData: ReplayData = {
      version: 1,
      levelIndex: 2,
      timestamp: 1234567890000,
      duration: 5000,
      frames: [
        { time: 0, direction: 'up' },
        { time: 500, direction: 'down' },
        { time: 1000, direction: 'left' },
        { time: 1500, direction: 'right' },
      ],
      finalMoves: 4,
      finalPushes: 1,
      levelsCompleted: 1,
      dailyMode: false,
    };

    it('should encode and decode replay data', () => {
      const encoded = Replay.encode(testData);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = Replay.decode(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.version).toBe(testData.version);
      expect(decoded!.levelIndex).toBe(testData.levelIndex);
      expect(decoded!.finalMoves).toBe(testData.finalMoves);
      expect(decoded!.finalPushes).toBe(testData.finalPushes);
      expect(decoded!.frames).toHaveLength(testData.frames.length);
    });

    it('should preserve frame data through encode/decode', () => {
      const encoded = Replay.encode(testData);
      const decoded = Replay.decode(encoded)!;

      for (let i = 0; i < testData.frames.length; i++) {
        expect(decoded.frames[i].time).toBe(testData.frames[i].time);
        expect(decoded.frames[i].direction).toBe(testData.frames[i].direction);
      }
    });

    it('should handle daily mode flag', () => {
      const dailyData = { ...testData, dailyMode: true };
      const encoded = Replay.encode(dailyData);
      const decoded = Replay.decode(encoded)!;

      expect(decoded.dailyMode).toBe(true);
    });

    it('should return null for invalid encoded data', () => {
      expect(Replay.decode('invalid')).toBeNull();
      expect(Replay.decode('')).toBeNull();
      expect(Replay.decode('!!!')).toBeNull();
    });

    it('should handle empty frames', () => {
      const emptyData = { ...testData, frames: [] };
      const encoded = Replay.encode(emptyData);
      const decoded = Replay.decode(encoded)!;

      expect(decoded.frames).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should calculate direction counts', () => {
      const data: ReplayData = {
        version: 1,
        levelIndex: 0,
        timestamp: Date.now(),
        duration: 5000,
        frames: [
          { time: 0, direction: 'up' },
          { time: 100, direction: 'up' },
          { time: 200, direction: 'right' },
          { time: 300, direction: 'down' },
          { time: 400, direction: 'left' },
          { time: 500, direction: 'left' },
          { time: 600, direction: 'left' },
        ],
        finalMoves: 7,
        finalPushes: 3,
        levelsCompleted: 1,
        dailyMode: false,
      };

      const stats = Replay.getStats(data);

      expect(stats.upCount).toBe(2);
      expect(stats.downCount).toBe(1);
      expect(stats.leftCount).toBe(3);
      expect(stats.rightCount).toBe(1);
      expect(stats.totalMoves).toBe(7);
    });

    it('should calculate moves per second', () => {
      const data: ReplayData = {
        version: 1,
        levelIndex: 0,
        timestamp: Date.now(),
        duration: 2000, // 2 seconds
        frames: [
          { time: 0, direction: 'up' },
          { time: 500, direction: 'down' },
          { time: 1000, direction: 'left' },
          { time: 1500, direction: 'right' },
        ],
        finalMoves: 4,
        finalPushes: 0,
        levelsCompleted: 1,
        dailyMode: false,
      };

      const stats = Replay.getStats(data);

      expect(stats.movesPerSecond).toBe(2); // 4 moves / 2 seconds
      expect(stats.durationSeconds).toBe(2);
    });
  });

  describe('generateShareCode', () => {
    it('should generate share code for normal mode', () => {
      const data: ReplayData = {
        version: 1,
        levelIndex: 0,
        timestamp: new Date('2026-03-07').getTime(),
        duration: 5000,
        frames: [],
        finalMoves: 42,
        finalPushes: 10,
        levelsCompleted: 1,
        dailyMode: false,
      };

      const code = Replay.generateShareCode(data);

      expect(code).toContain('CRATES-');
      expect(code).toContain('-M42-');
      expect(code).toContain('-L1');
    });

    it('should generate share code for daily mode', () => {
      const data: ReplayData = {
        version: 1,
        levelIndex: 0,
        timestamp: new Date('2026-03-07').getTime(),
        duration: 5000,
        frames: [],
        finalMoves: 100,
        finalPushes: 25,
        levelsCompleted: 5,
        dailyMode: true,
      };

      const code = Replay.generateShareCode(data);

      expect(code).toContain('CRATES-D-');
      expect(code).toContain('-M100-');
      expect(code).toContain('-L5');
    });
  });
});
