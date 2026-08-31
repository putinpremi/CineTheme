import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlaybackTelemetry } from '../../src/player/telemetry/playbackTelemetry';
import { playbackService } from '../../src/api/services/playbackService';

describe('PlaybackTelemetry Engine', () => {
  const serverUrl = 'http://127.0.0.1:8096';
  const token = 'test-token';
  const itemId = 'movie-1';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends PlaybackStart and begins 10-second periodic heartbeat', async () => {
    const startSpy = vi.spyOn(playbackService, 'reportPlaybackStart').mockResolvedValue();
    const progressSpy = vi.spyOn(playbackService, 'reportPlaybackProgress').mockResolvedValue();

    const telemetry = new PlaybackTelemetry();
    await telemetry.startSession({
      serverUrl,
      token,
      itemId,
      mediaSourceId: 'source-1',
      playSessionId: 'sess-1',
      playMethod: 'DirectPlay',
      initialPositionSeconds: 10,
    });

    expect(startSpy).toHaveBeenCalledWith(
      serverUrl,
      token,
      expect.objectContaining({
        ItemId: itemId,
        PositionTicks: 100_000_000,
      })
    );

    // Advance 10 seconds
    vi.advanceTimersByTime(10_000);
    expect(progressSpy).toHaveBeenCalledWith(
      serverUrl,
      token,
      expect.objectContaining({
        EventName: 'TimeUpdate',
      })
    );

    telemetry.stopSession();
  });

  it('debounces rapid timeline scrubbing with 500ms trailing timer', async () => {
    vi.spyOn(playbackService, 'reportPlaybackStart').mockResolvedValue();
    const progressSpy = vi.spyOn(playbackService, 'reportPlaybackProgress').mockResolvedValue();

    const telemetry = new PlaybackTelemetry();
    await telemetry.startSession({
      serverUrl,
      token,
      itemId,
      playMethod: 'DirectPlay',
      initialPositionSeconds: 0,
    });

    // Fire 5 seek events within 200ms
    for (let i = 1; i <= 5; i++) {
      telemetry.reportSeek(i * 10, false, false, 1);
      vi.advanceTimersByTime(40);
    }

    // No progress calls before 500ms debounce
    expect(progressSpy).not.toHaveBeenCalled();

    // Advance remaining 500ms
    vi.advanceTimersByTime(500);

    expect(progressSpy).toHaveBeenCalledTimes(1);
    expect(progressSpy).toHaveBeenCalledWith(
      serverUrl,
      token,
      expect.objectContaining({
        EventName: 'Seek',
        PositionTicks: 500_000_000, // 50 seconds
      })
    );

    telemetry.stopSession();
  });

  it('sends immediate progress event on pause and stops telemetry cleanly', async () => {
    vi.spyOn(playbackService, 'reportPlaybackStart').mockResolvedValue();
    const progressSpy = vi.spyOn(playbackService, 'reportPlaybackProgress').mockResolvedValue();
    const stopSpy = vi.spyOn(playbackService, 'reportPlaybackStopped').mockResolvedValue();

    const telemetry = new PlaybackTelemetry();
    await telemetry.startSession({
      serverUrl,
      token,
      itemId,
      playMethod: 'DirectPlay',
      initialPositionSeconds: 5,
    });

    // Trigger pause transition
    telemetry.reportProgress(20, true, false, 1);

    expect(progressSpy).toHaveBeenCalledWith(
      serverUrl,
      token,
      expect.objectContaining({
        EventName: 'Pause',
        IsPaused: true,
        PositionTicks: 200_000_000,
      })
    );

    await telemetry.stopSession(25);

    expect(stopSpy).toHaveBeenCalledWith(
      serverUrl,
      token,
      expect.objectContaining({
        ItemId: itemId,
        PositionTicks: 250_000_000,
      })
    );
  });
});
