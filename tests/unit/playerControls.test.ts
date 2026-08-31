import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerControls } from '../../src/hooks/usePlayerControls';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';

describe('usePlayerControls Auto-Hide Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePlayerStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps controls visible while paused', () => {
    usePlayerStore.getState().setPaused(true);
    const { result } = renderHook(() => usePlayerControls({ hideTimeoutMs: 1000 }));

    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('hides controls after inactivity timeout while playing', () => {
    usePlayerStore.setState({ isPaused: false, playerState: 'PLAYING' });
    const { result } = renderHook(() => usePlayerControls({ hideTimeoutMs: 1000 }));

    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isVisible).toBe(false);

    // Show controls on activity
    act(() => {
      result.current.showControls();
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('keeps controls visible when a menu is open', () => {
    usePlayerStore.setState({ isPaused: false, playerState: 'PLAYING' });
    const { result } = renderHook(() =>
      usePlayerControls({ hideTimeoutMs: 1000, isMenuOpen: true })
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isVisible).toBe(true);
  });
});
