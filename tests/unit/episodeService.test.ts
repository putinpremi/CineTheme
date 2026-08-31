import { describe, it, expect, vi } from 'vitest';
import { episodeService } from '../../src/api/services/episodeService';
import { httpClient } from '../../src/api/client/httpClient';

describe('EpisodeService Sequence & Navigation Resolution', () => {
  it('resolves previous, current, and next episodes in season sequence', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      Items: [
        { Id: 'ep-1', Name: 'Cruel Angel', IndexNumber: 1, ParentIndexNumber: 1, SeriesName: 'Evangelion' },
        { Id: 'ep-2', Name: 'Unfamiliar Ceiling', IndexNumber: 2, ParentIndexNumber: 1, SeriesName: 'Evangelion' },
        { Id: 'ep-3', Name: 'A Transfer', IndexNumber: 3, ParentIndexNumber: 1, SeriesName: 'Evangelion' },
      ],
      TotalRecordCount: 3,
    });

    const nav = await episodeService.getAdjacentEpisodes(
      'http://127.0.0.1:8096',
      'user-1',
      'token-1',
      'series-eva',
      'season-1',
      'ep-2'
    );

    expect(nav.currentEpisodeId).toBe('ep-2');
    expect(nav.episodeTitle).toBe('Unfamiliar Ceiling');
    expect(nav.previousEpisodeId).toBe('ep-1');
    expect(nav.previousEpisodeTitle).toBe('Cruel Angel');
    expect(nav.nextEpisodeId).toBe('ep-3');
    expect(nav.nextEpisodeTitle).toBe('A Transfer');
  });

  it('handles first and last episode boundaries correctly', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      Items: [
        { Id: 'ep-1', Name: 'Cruel Angel', IndexNumber: 1 },
        { Id: 'ep-2', Name: 'Unfamiliar Ceiling', IndexNumber: 2 },
      ],
      TotalRecordCount: 2,
    });

    const firstNav = await episodeService.getAdjacentEpisodes(
      'http://127.0.0.1:8096',
      'user-1',
      'token-1',
      'series-eva',
      'season-1',
      'ep-1'
    );

    expect(firstNav.previousEpisodeId).toBeUndefined();
    expect(firstNav.nextEpisodeId).toBe('ep-2');
  });
});
