import { describe, it, expect, vi } from 'vitest';
import { playbackService } from '../../src/api/services/playbackService';
import { httpClient } from '../../src/api/client/httpClient';

describe('PlaybackService REST API Operations', () => {
  const serverUrl = 'http://127.0.0.1:8096';
  const userId = 'user-1';
  const token = 'test-valid-access-token-xyz';
  const itemId = 'movie-item-1';

  it('posts PlaybackInfo request with DeviceProfile and parameters', async () => {
    const postSpy = vi.spyOn(httpClient, 'post');

    const result = await playbackService.getPlaybackInfo(serverUrl, userId, token, itemId, {
      startTimeTicks: 10_000_000,
      audioStreamIndex: 1,
      subtitleStreamIndex: 3,
      maxStreamingBitrate: 80_000_000,
    });

    expect(postSpy).toHaveBeenCalledWith(
      serverUrl,
      `/Items/${itemId}/PlaybackInfo`,
      expect.objectContaining({
        UserId: userId,
        StartTimeTicks: 10_000_000,
        AudioStreamIndex: 1,
        SubtitleStreamIndex: 3,
        MaxStreamingBitrate: 80_000_000,
        DeviceProfile: expect.objectContaining({
          Name: 'CineTheme Web Player',
        }),
      }),
      expect.objectContaining({
        token,
        queryParams: { userId },
      })
    );

    expect(result.MediaSources.length).toBeGreaterThan(0);
    postSpy.mockRestore();
  });

  it('reports PlaybackStart to /Sessions/Playing', async () => {
    const postSpy = vi.spyOn(httpClient, 'post');

    await playbackService.reportPlaybackStart(serverUrl, token, {
      ItemId: itemId,
      MediaSourceId: 'source-1',
      PlaySessionId: 'sess-1',
      PlayMethod: 'DirectPlay',
      PositionTicks: 0,
    });

    expect(postSpy).toHaveBeenCalledWith(
      serverUrl,
      '/Sessions/Playing',
      expect.objectContaining({
        ItemId: itemId,
        PlayMethod: 'DirectPlay',
      }),
      expect.objectContaining({ token })
    );

    postSpy.mockRestore();
  });

  it('reports PlaybackProgress to /Sessions/Playing/Progress', async () => {
    const postSpy = vi.spyOn(httpClient, 'post');

    await playbackService.reportPlaybackProgress(serverUrl, token, {
      ItemId: itemId,
      PlaySessionId: 'sess-1',
      PositionTicks: 100_000_000,
      EventName: 'TimeUpdate',
    });

    expect(postSpy).toHaveBeenCalledWith(
      serverUrl,
      '/Sessions/Playing/Progress',
      expect.objectContaining({
        ItemId: itemId,
        PositionTicks: 100_000_000,
        EventName: 'TimeUpdate',
      }),
      expect.objectContaining({ token })
    );

    postSpy.mockRestore();
  });

  it('reports PlaybackStopped to /Sessions/Playing/Stopped', async () => {
    const postSpy = vi.spyOn(httpClient, 'post');

    await playbackService.reportPlaybackStopped(serverUrl, token, {
      ItemId: itemId,
      PlaySessionId: 'sess-1',
      PositionTicks: 500_000_000,
    });

    expect(postSpy).toHaveBeenCalledWith(
      serverUrl,
      '/Sessions/Playing/Stopped',
      expect.objectContaining({
        ItemId: itemId,
        PositionTicks: 500_000_000,
      }),
      expect.objectContaining({ token })
    );

    postSpy.mockRestore();
  });
});
