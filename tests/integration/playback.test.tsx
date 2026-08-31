import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlayerController } from '../../src/player/playerController';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';

describe('PlayerController & Playback Pipeline Integration (MSW)', () => {
  let videoElement: HTMLVideoElement;
  let controller: PlayerController;

  const serverUrl = 'http://127.0.0.1:8096';
  const userId = 'user-guid-67890';
  const token = 'test-valid-access-token-xyz';

  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    usePlayerStore.getState().reset();

    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: token,
        serverId: 'server-guid-12345',
        serverUrl,
        user: { id: userId, name: 'TestCinematicUser', isAdmin: true, isDisabled: false },
        lastConnected: Date.now(),
      },
    });

    videoElement = document.createElement('video');
    controller = new PlayerController();
  });

  afterEach(() => {
    controller.destroy();
  });

  it('negotiates DirectPlay for standard MP4 item and initializes READY state', async () => {
    controller.initialize(videoElement, { serverUrl, userId, token });

    await controller.loadMedia('movie-item-1', { startTimeSeconds: 0 });

    const state = usePlayerStore.getState();
    expect(state.playerState).toBe('READY');
    expect(state.playbackMode).toBe('DIRECT_PLAY');
    expect(state.itemId).toBe('movie-item-1');
    expect(state.duration).toBe(8880);
    expect(state.audioTracks.length).toBeGreaterThan(0);
    expect(state.subtitleTracks.length).toBeGreaterThan(0);
    expect(videoElement.src).toContain('static=true');
  });

  it('negotiates DirectStream for MKV remux item', async () => {
    controller.initialize(videoElement, { serverUrl, userId, token });

    await controller.loadMedia('remux-item-mkv', { startTimeSeconds: 60 });

    const state = usePlayerStore.getState();
    expect(state.playbackMode).toBe('DIRECT_STREAM');
    expect(state.itemId).toBe('remux-item-mkv');
    expect(state.audioTracks).toBeDefined();
  });

  it('negotiates Transcode for unsupported video codecs', async () => {
    controller.initialize(videoElement, { serverUrl, userId, token });

    await controller.loadMedia('transcode-item-mpeg2');

    const state = usePlayerStore.getState();
    expect(state.playbackMode).toBe('TRANSCODE');
  });

  it('sets error state when playback negotiation encounters server error', async () => {
    controller.initialize(videoElement, { serverUrl, userId, token });

    await controller.loadMedia('error-item-trigger');

    const state = usePlayerStore.getState();
    expect(state.playerState).toBe('ERROR');
    expect(state.error).toBeDefined();
  });

  it('invokes onUnauthorized callback when server returns 401', async () => {
    const unauthSpy = vi.fn();
    controller.initialize(videoElement, {
      serverUrl,
      userId,
      token: 'invalid-expired-token',
      onUnauthorized: unauthSpy,
    });

    await controller.loadMedia('movie-item-1');

    expect(unauthSpy).toHaveBeenCalled();
  });

  it('switches audio tracks and subtitle tracks cleanly', async () => {
    controller.initialize(videoElement, { serverUrl, userId, token });
    await controller.loadMedia('movie-item-1');

    await controller.setAudioTrack(2);
    expect(usePlayerStore.getState().activeAudioIndex).toBe(2);

    await controller.setSubtitleTrack(4);
    expect(usePlayerStore.getState().activeSubtitleIndex).toBe(4);

    await controller.setSubtitleTrack(null);
    expect(usePlayerStore.getState().activeSubtitleIndex).toBeNull();
  });
});
