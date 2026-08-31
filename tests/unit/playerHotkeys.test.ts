import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePlayerHotkeys } from '../../src/hooks/usePlayerHotkeys';
import type { PlayerController } from '../../src/player/playerController';

describe('usePlayerHotkeys Keyboard Navigation', () => {
  let controllerMock: {
    togglePlay: ReturnType<typeof vi.fn>;
    seekRelative: ReturnType<typeof vi.fn>;
    adjustVolume: ReturnType<typeof vi.fn>;
    toggleMute: ReturnType<typeof vi.fn>;
  };
  let controllerRef: { current: PlayerController | null };
  let containerRef: { current: HTMLDivElement | null };

  beforeEach(() => {
    controllerMock = {
      togglePlay: vi.fn(),
      seekRelative: vi.fn(),
      adjustVolume: vi.fn(),
      toggleMute: vi.fn(),
    };
    controllerRef = { current: controllerMock as unknown as PlayerController };
    containerRef = { current: document.createElement('div') };
  });

  it('triggers play/pause on Space or K key', () => {
    renderHook(() =>
      usePlayerHotkeys({
        controllerRef,
        containerRef,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(controllerMock.togglePlay).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
    expect(controllerMock.togglePlay).toHaveBeenCalledTimes(2);
  });

  it('triggers seeking on Left and Right arrow keys', () => {
    renderHook(() =>
      usePlayerHotkeys({
        controllerRef,
        containerRef,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
    expect(controllerMock.seekRelative).toHaveBeenCalledWith(-10);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(controllerMock.seekRelative).toHaveBeenCalledWith(10);

    // Shift modifier
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', shiftKey: true }));
    expect(controllerMock.seekRelative).toHaveBeenCalledWith(-30);
  });

  it('triggers volume adjustment and mute', () => {
    renderHook(() =>
      usePlayerHotkeys({
        controllerRef,
        containerRef,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    expect(controllerMock.adjustVolume).toHaveBeenCalledWith(0.05);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    expect(controllerMock.adjustVolume).toHaveBeenCalledWith(-0.05);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }));
    expect(controllerMock.toggleMute).toHaveBeenCalled();
  });

  it('ignores hotkeys when typing in input or textarea elements', () => {
    renderHook(() =>
      usePlayerHotkeys({
        controllerRef,
        containerRef,
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { code: 'Space' });
    Object.defineProperty(event, 'target', { value: input, writable: false });

    window.dispatchEvent(event);
    expect(controllerMock.togglePlay).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
