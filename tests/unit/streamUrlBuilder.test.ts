import { describe, it, expect } from 'vitest';
import {
  buildDirectPlayUrl,
  buildHlsStreamUrl,
  buildSubtitleStreamUrl,
  redactMediaUrl,
} from '../../src/player/streamUrlBuilder';

describe('Stream URL Builder & Security Redaction', () => {
  const serverUrl = 'http://127.0.0.1:8096';
  const token = 'secret-token-xyz-123';
  const itemId = 'movie-1';
  const mediaSourceId = 'source-1';

  it('builds direct play stream URL with static=true and token', () => {
    const url = buildDirectPlayUrl({
      serverUrl,
      itemId,
      mediaSourceId,
      playSessionId: 'sess-1',
      container: 'mp4',
      token,
    });

    expect(url).toContain('http://127.0.0.1:8096/Videos/movie-1/stream.mp4');
    expect(url).toContain('static=true');
    expect(url).toContain('mediaSourceId=source-1');
    expect(url).toContain('playSessionId=sess-1');
    expect(url).toContain('api_key=secret-token-xyz-123');
  });

  it('builds HLS stream URL appending api_key to TranscodingUrl', () => {
    const url = buildHlsStreamUrl({
      serverUrl,
      transcodingUrl: '/Videos/movie-1/master.m3u8?DeviceId=dev-1',
      token,
    });

    expect(url).toBe('http://127.0.0.1:8096/Videos/movie-1/master.m3u8?DeviceId=dev-1&api_key=secret-token-xyz-123');
  });

  it('builds subtitle stream extraction URL', () => {
    const url = buildSubtitleStreamUrl({
      serverUrl,
      itemId,
      mediaSourceId,
      subtitleIndex: 3,
      format: 'ass',
      token,
    });

    expect(url).toBe('http://127.0.0.1:8096/Videos/movie-1/source-1/Subtitles/3/Stream.ass?api_key=secret-token-xyz-123');
  });

  it('redacts tokens and passwords from media URLs', () => {
    const rawUrl = 'http://127.0.0.1:8096/Videos/movie-1/stream.mp4?static=true&api_key=my-secret-token-12345';
    const redacted = redactMediaUrl(rawUrl);

    expect(redacted).not.toContain('my-secret-token-12345');
    expect(redacted).toContain('api_key=[REDACTED]');
  });
});
