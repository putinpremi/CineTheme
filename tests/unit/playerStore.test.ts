import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';

describe('PlayerStore Zustand State Management', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it('initializes with default IDLE state and empty session', () => {
    const state = usePlayerStore.getState();
    expect(state.playerState).toBe('IDLE');
    expect(state.itemId).toBeNull();
    expect(state.currentTime).toBe(0);
    expect(state.isPaused).toBe(true);
  });

  it('sets session and initializes READY state', () => {
    usePlayerStore.getState().setSession({
      itemId: 'item-1',
      mediaSourceId: 'source-1',
      playSessionId: 'sess-1',
      playbackMode: 'DIRECT_PLAY',
      duration: 3600,
      audioTracks: [{ index: 1, codec: 'aac', isDefault: true, isForced: false, isExternal: false }],
      subtitleTracks: [],
      initialTime: 120,
    });

    const state = usePlayerStore.getState();
    expect(state.playerState).toBe('READY');
    expect(state.itemId).toBe('item-1');
    expect(state.duration).toBe(3600);
    expect(state.currentTime).toBe(120);
    expect(state.playbackMode).toBe('DIRECT_PLAY');
  });

  it('manages volume, mute, and time updates correctly', () => {
    usePlayerStore.getState().setVolume(0.8);
    expect(usePlayerStore.getState().volume).toBe(0.8);

    usePlayerStore.getState().setMuted(true);
    expect(usePlayerStore.getState().isMuted).toBe(true);

    usePlayerStore.getState().setTime(45, 120, 90);
    expect(usePlayerStore.getState().currentTime).toBe(45);
    expect(usePlayerStore.getState().duration).toBe(120);
    expect(usePlayerStore.getState().bufferedTime).toBe(90);
  });

  it('increments recovery attempts and transitions to RECOVERING state', () => {
    const attempt1 = usePlayerStore.getState().incrementRecoveryAttempt();
    expect(attempt1).toBe(1);
    expect(usePlayerStore.getState().playerState).toBe('RECOVERING');

    const attempt2 = usePlayerStore.getState().incrementRecoveryAttempt();
    expect(attempt2).toBe(2);

    usePlayerStore.getState().resetRecovery();
    expect(usePlayerStore.getState().recoveryAttempt).toBe(0);
  });
});
