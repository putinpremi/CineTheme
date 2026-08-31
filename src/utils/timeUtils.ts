/**
 * Centralized Jellyfin tick and second time conversion utilities.
 * Jellyfin represents time in 100-nanosecond ticks (10,000,000 ticks = 1 second).
 */

const TICKS_PER_SECOND = 10_000_000;

/**
 * Converts Jellyfin ticks to seconds.
 */
export function ticksToSeconds(ticks?: number | null): number {
  if (ticks === undefined || ticks === null || isNaN(ticks) || ticks <= 0) {
    return 0;
  }
  return ticks / TICKS_PER_SECOND;
}

/**
 * Converts seconds to Jellyfin ticks (rounded to nearest integer tick).
 */
export function secondsToTicks(seconds?: number | null): number {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) {
    return 0;
  }
  return Math.round(seconds * TICKS_PER_SECOND);
}

/**
 * Formats time in seconds to a human-readable string (e.g. "1:24:50" or "04:12").
 */
export function formatPlaybackTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }

  return `${paddedMins}:${paddedSecs}`;
}
