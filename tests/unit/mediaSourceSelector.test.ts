import { describe, it, expect } from 'vitest';
import { selectMediaSource } from '../../src/player/mediaSourceSelector';
import type { PlaybackInfoResponseDto } from '../../src/api/types/jellyfinDto';

describe('MediaSourceSelector Decision Logic', () => {
  const serverUrl = 'http://127.0.0.1:8096';
  const token = 'test-token';
  const itemId = 'movie-1';

  it('selects DirectPlay when SupportsDirectPlay is true', () => {
    const playbackInfo: PlaybackInfoResponseDto = {
      PlaySessionId: 'sess-direct',
      MediaSources: [
        {
          Id: 'source-1',
          Container: 'mp4',
          SupportsDirectPlay: true,
          SupportsDirectStream: true,
          SupportsTranscoding: true,
          RunTimeTicks: 72_000_000_000,
          MediaStreams: [
            { Type: 'Audio', Index: 1, Codec: 'aac', IsDefault: true },
            { Type: 'Subtitle', Index: 2, Codec: 'vtt', DeliveryMethod: 'External' },
          ],
        },
      ],
    };

    const source = selectMediaSource({ serverUrl, itemId, token, playbackInfo });

    expect(source.playbackMode).toBe('DIRECT_PLAY');
    expect(source.playMethod).toBe('DirectPlay');
    expect(source.url).toContain('static=true');
    expect(source.totalDurationSeconds).toBe(7200);
    expect(source.audioTracks).toHaveLength(1);
    expect(source.subtitleTracks).toHaveLength(1);
  });

  it('selects DirectStream when SupportsDirectPlay is false and SupportsDirectStream is true', () => {
    const playbackInfo: PlaybackInfoResponseDto = {
      PlaySessionId: 'sess-stream',
      MediaSources: [
        {
          Id: 'source-2',
          Container: 'mkv',
          SupportsDirectPlay: false,
          SupportsDirectStream: true,
          SupportsTranscoding: true,
          TranscodingUrl: '/Videos/movie-1/master.m3u8?DeviceId=dev-1',
          RunTimeTicks: 36_000_000_000,
          MediaStreams: [{ Type: 'Audio', Index: 1, Codec: 'dts' }],
        },
      ],
    };

    const source = selectMediaSource({ serverUrl, itemId, token, playbackInfo });

    expect(source.playbackMode).toBe('DIRECT_STREAM');
    expect(source.playMethod).toBe('DirectStream');
    expect(source.url).toContain('/master.m3u8');
    expect(source.totalDurationSeconds).toBe(3600);
  });

  it('throws error when no media sources are provided', () => {
    const playbackInfo: PlaybackInfoResponseDto = {
      MediaSources: [],
    };

    expect(() =>
      selectMediaSource({ serverUrl, itemId, token, playbackInfo })
    ).toThrowError(/No playable media sources/i);
  });
});
