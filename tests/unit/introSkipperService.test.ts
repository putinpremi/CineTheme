import { describe, it, expect, vi, beforeEach } from 'vitest';
import { introSkipperService } from '../../src/api/services/introSkipperService';
import { httpClient } from '../../src/api/client/httpClient';

describe('IntroSkipperService Probing & Graceful Degradation', () => {
  beforeEach(() => {
    introSkipperService.resetCache();
    vi.restoreAllMocks();
  });

  it('successfully returns IntroSkipper timestamps when primary endpoint succeeds', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      IntroStart: 90.5,
      IntroEnd: 180.0,
      CreditsStart: 1350.0,
      CreditsEnd: 1440.0,
      Valid: true,
    });

    const result = await introSkipperService.getIntroTimestamps(
      'http://127.0.0.1:8096',
      'test-token',
      'item-1'
    );

    expect(result).not.toBeNull();
    expect(result?.IntroStart).toBe(90.5);
    expect(result?.IntroEnd).toBe(180.0);
  });

  it('falls back to secondary endpoint when primary path returns 404', async () => {
    vi.spyOn(httpClient, 'get')
      .mockRejectedValueOnce(new Error('404 Not Found'))
      .mockResolvedValueOnce({
        IntroStart: 85.0,
        IntroEnd: 175.0,
        Valid: true,
      });

    const result = await introSkipperService.getIntroTimestamps(
      'http://127.0.0.1:8096',
      'test-token',
      'item-1'
    );

    expect(result).not.toBeNull();
    expect(result?.IntroStart).toBe(85.0);
  });

  it('fails gracefully and returns null without throwing when plugin is absent', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValue(new Error('404 Not Found'));

    const result = await introSkipperService.getIntroTimestamps(
      'http://127.0.0.1:8096',
      'test-token',
      'item-1'
    );

    expect(result).toBeNull();

    // Subsequent calls should short-circuit via negative cache
    const secondResult = await introSkipperService.getIntroTimestamps(
      'http://127.0.0.1:8096',
      'test-token',
      'item-2'
    );
    expect(secondResult).toBeNull();
  });
});
