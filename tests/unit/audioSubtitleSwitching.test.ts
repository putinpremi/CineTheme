import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerController } from '../../src/player/playerController';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';
import { playbackService } from '../../src/api/services/playbackService';

describe('Audio & Subtitle Track Switching Hardening', () => {
  let controller: PlayerController;
  let videoElement: HTMLVideoElement;

  beforeEach(() => {
    usePlayerStore.getState().reset();
    controller = new PlayerController();
    videoElement = document.createElement('video');

    controller.initialize(videoElement, {
      serverUrl: 'http://127.0.0.1:8096',
      userId: 'user-1',
      token: 'test-valid-access-token-xyz',
    });
  });

  it('switches audio track preserving current timestamp and active playback state', async () => {
    const getPlaybackInfoSpy = vi.spyOn(playbackService, 'getPlaybackInfo');

    await controller.loadMedia('movie-item-1', {
      startTimeSeconds: 45,
      audioStreamIndex: 1,
    });

    expect(usePlayerStore.getState().activeAudioIndex).toBe(1);

    // Switch to Japanese Audio Track (Index 2)
    await controller.setAudioTrack(2);

    expect(usePlayerStore.getState().activeAudioIndex).toBe(2);
    expect(getPlaybackInfoSpy).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8096',
      'user-1',
      'test-valid-access-token-xyz',
      'movie-item-1',
      expect.objectContaining({
        audioStreamIndex: 2,
      }),
      expect.anything()
    );
  });

  it('switches subtitle track between Off, WebVTT, and ASS without reloading entire video', async () => {
    await controller.loadMedia('movie-item-1', {
      subtitleStreamIndex: 3, // WebVTT
    });

    expect(usePlayerStore.getState().activeSubtitleIndex).toBe(3);

    // Switch to Off
    await controller.setSubtitleTrack(null);
    expect(usePlayerStore.getState().activeSubtitleIndex).toBeNull();

    // Switch to ASS / Styled (Index 4)
    await controller.setSubtitleTrack(4);
    expect(usePlayerStore.getState().activeSubtitleIndex).toBe(4);
  });

  it('adjusts audio delay and subtitle delay offsets within practical limits', () => {
    controller.setAudioDelay(150);
    expect(usePlayerStore.getState().audioDelayMs).toBe(150);

    controller.setAudioDelay(-6000); // Exceeds lower bound
    expect(usePlayerStore.getState().audioDelayMs).toBe(-5000);

    controller.setSubtitleDelay(250);
    expect(usePlayerStore.getState().subtitleDelayMs).toBe(250);

    controller.setSubtitleDelay(6000); // Exceeds upper bound
    expect(usePlayerStore.getState().subtitleDelayMs).toBe(5000);
  });
});
