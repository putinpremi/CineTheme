import { describe, it, expect, vi } from 'vitest';
import {
  isMediaSessionSupported,
  setMediaSessionMetadata,
  setMediaSessionHandlers,
} from '../../src/utils/mediaSessionUtils';

describe('Media Session API Utilities', () => {
  it('detects media session support without throwing errors', () => {
    expect(typeof isMediaSessionSupported()).toBe('boolean');
  });

  it('sets metadata and attaches action handlers safely', () => {
    setMediaSessionMetadata({
      title: 'Inception',
      artist: 'Christopher Nolan',
      album: 'Cinematic Classics',
    });

    const onPlay = vi.fn();
    const cleanup = setMediaSessionHandlers({
      onPlay,
    });

    expect(typeof cleanup).toBe('function');
    cleanup();
  });
});
