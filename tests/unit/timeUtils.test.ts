import { describe, it, expect } from 'vitest';
import { ticksToSeconds, secondsToTicks, formatPlaybackTime } from '../../src/utils/timeUtils';

describe('Time and Tick Conversion Utilities', () => {
  it('converts Jellyfin ticks to seconds correctly', () => {
    expect(ticksToSeconds(10_000_000)).toBe(1);
    expect(ticksToSeconds(88_800_000_000)).toBe(8880);
    expect(ticksToSeconds(0)).toBe(0);
    expect(ticksToSeconds(-100)).toBe(0);
    expect(ticksToSeconds(undefined)).toBe(0);
    expect(ticksToSeconds(null)).toBe(0);
    expect(ticksToSeconds(NaN)).toBe(0);
  });

  it('converts seconds to Jellyfin ticks correctly', () => {
    expect(secondsToTicks(1)).toBe(10_000_000);
    expect(secondsToTicks(8880)).toBe(88_800_000_000);
    expect(secondsToTicks(0)).toBe(0);
    expect(secondsToTicks(-10)).toBe(0);
    expect(secondsToTicks(undefined)).toBe(0);
    expect(secondsToTicks(null)).toBe(0);
  });

  it('formats seconds into human-readable playback timecodes', () => {
    expect(formatPlaybackTime(0)).toBe('00:00');
    expect(formatPlaybackTime(45)).toBe('00:45');
    expect(formatPlaybackTime(125)).toBe('02:05');
    expect(formatPlaybackTime(3665)).toBe('1:01:05');
    expect(formatPlaybackTime(8880)).toBe('2:28:00');
  });
});
