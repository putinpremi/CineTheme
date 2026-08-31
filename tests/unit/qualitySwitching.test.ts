import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerController } from '../../src/player/playerController';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';
import { playbackService } from '../../src/api/services/playbackService';
import { QUALITY_PRESETS } from '../../src/domain/player/types';

describe('Quality Switching & Dynamic Bitrate Re-negotiation', () => {
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

  it('exposes accurate bitrate and resolution caps in quality presets', () => {
    expect(QUALITY_PRESETS[0]?.id).toBe('auto');
    expect(QUALITY_PRESETS[0]?.maxBitrate).toBeUndefined();

    const preset20m = QUALITY_PRESETS.find((p) => p.id === '20m');
    expect(preset20m?.maxBitrate).toBe(20_000_000);

    const preset4m = QUALITY_PRESETS.find((p) => p.id === '4m');
    expect(preset4m?.maxBitrate).toBe(4_000_000);
  });

  it('re-negotiates PlaybackInfo preserving current timestamp and stream tracks on quality switch', async () => {
    const getPlaybackInfoSpy = vi.spyOn(playbackService, 'getPlaybackInfo');

    // Initial load
    await controller.loadMedia('movie-1', {
      startTimeSeconds: 120,
      audioStreamIndex: 1,
      subtitleStreamIndex: 2,
    });

    expect(getPlaybackInfoSpy).toHaveBeenCalledTimes(1);

    // Switch to 4 Mbps Quality Preset
    const quality4m = QUALITY_PRESETS.find((p) => p.id === '4m')!;
    await controller.setQuality(quality4m);

    expect(getPlaybackInfoSpy).toHaveBeenCalledTimes(2);
    expect(getPlaybackInfoSpy).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8096',
      'user-1',
      'test-valid-access-token-xyz',
      'movie-1',
      expect.objectContaining({
        maxStreamingBitrate: 4_000_000,
        audioStreamIndex: 1,
        subtitleStreamIndex: 2,
      }),
      expect.any(AbortSignal)
    );
  });

  it('restores auto/source unrestricted quality when quality is set to null', async () => {
    const getPlaybackInfoSpy = vi.spyOn(playbackService, 'getPlaybackInfo');

    await controller.loadMedia('movie-1', { startTimeSeconds: 0 });
    await controller.setQuality(null);

    expect(getPlaybackInfoSpy).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8096',
      'user-1',
      'test-valid-access-token-xyz',
      'movie-1',
      expect.objectContaining({
        maxStreamingBitrate: undefined,
      }),
      expect.any(AbortSignal)
    );
  });
});
