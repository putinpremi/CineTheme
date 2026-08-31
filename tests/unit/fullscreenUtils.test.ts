import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isFullscreenSupported,
  isFullscreen,
  requestFullscreen,
  exitFullscreen,
  toggleFullscreen,
} from '../../src/utils/fullscreenUtils';

describe('Fullscreen Utilities', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('checks fullscreen support and active status', () => {
    expect(typeof isFullscreenSupported()).toBe('boolean');
    expect(typeof isFullscreen()).toBe('boolean');
  });

  it('calls requestFullscreen on target element', async () => {
    const requestSpy = vi.fn().mockResolvedValue(undefined);
    element.requestFullscreen = requestSpy;

    await requestFullscreen(element);
    expect(requestSpy).toHaveBeenCalled();
  });

  it('calls exitFullscreen safely', async () => {
    const exitSpy = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = exitSpy;

    await exitFullscreen();
    expect(exitSpy).toHaveBeenCalled();
  });

  it('toggles fullscreen state smoothly', async () => {
    const requestSpy = vi.fn().mockResolvedValue(undefined);
    element.requestFullscreen = requestSpy;

    await toggleFullscreen(element);
    expect(requestSpy).toHaveBeenCalled();
  });
});
