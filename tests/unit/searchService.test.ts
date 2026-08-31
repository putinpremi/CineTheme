import { describe, it, expect, vi } from 'vitest';
import { searchService } from '../../src/api/services/searchService';
import { httpClient } from '../../src/api/client/httpClient';

describe('SearchService Operations & Parameter Mapping', () => {
  const serverUrl = 'http://127.0.0.1:8096';
  const userId = 'user-guid-67890';
  const token = 'test-valid-access-token-xyz';

  it('correctly maps SearchTerm, pagination, and sorting parameters', async () => {
    const getSpy = vi.spyOn(httpClient, 'get');

    const result = await searchService.search(serverUrl, userId, token, {
      query: 'Inception',
      mediaType: 'Movie',
      genre: 'Sci-Fi',
      year: 2010,
      sortBy: 'CommunityRating',
      sortOrder: 'Descending',
      page: 1,
      pageSize: 10,
      isFavorite: true,
      isPlayed: false,
    });

    expect(getSpy).toHaveBeenCalledWith(
      serverUrl,
      `/Users/${userId}/Items`,
      expect.objectContaining({
        token,
        queryParams: expect.objectContaining({
          SearchTerm: 'Inception',
          IncludeItemTypes: 'Movie',
          Recursive: true,
          Genres: 'Sci-Fi',
          Years: '2010',
          SortBy: 'CommunityRating',
          SortOrder: 'Descending',
          StartIndex: 0,
          Limit: 10,
          Filters: expect.stringContaining('IsFavorite'),
        }),
      })
    );

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0]?.name).toBe('Inception');
    getSpy.mockRestore();
  });

  it('handles empty search query and default media type mapping', async () => {
    const getSpy = vi.spyOn(httpClient, 'get');

    await searchService.search(serverUrl, userId, token, {
      query: '   ',
      mediaType: 'All',
      page: 2,
      pageSize: 20,
    });

    expect(getSpy).toHaveBeenCalledWith(
      serverUrl,
      `/Users/${userId}/Items`,
      expect.objectContaining({
        queryParams: expect.objectContaining({
          SearchTerm: undefined,
          IncludeItemTypes: 'Movie,Series,Season,Episode',
          StartIndex: 20,
          Limit: 20,
        }),
      })
    );

    getSpy.mockRestore();
  });

  it('supports custom AbortSignal cancellation', async () => {
    const controller = new AbortController();
    const searchPromise = searchService.search(
      serverUrl,
      userId,
      token,
      { query: 'test' },
      controller.signal
    );

    controller.abort();
    await expect(searchPromise).rejects.toThrow();
  });
});
