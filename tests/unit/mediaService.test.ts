import { describe, it, expect } from 'vitest';
import { mediaService } from '../../src/api/services/mediaService';
import { ticksToSeconds, mapQueryResultToPagedResult } from '../../src/domain/media/mappers';

describe('MediaService Operations & Mappers', () => {
  const serverUrl = 'http://127.0.0.1:8096';
  const userId = 'user-guid-67890';
  const token = 'test-valid-access-token-xyz';

  it('converts Jellyfin ticks to seconds correctly (1 tick = 100ns)', () => {
    expect(ticksToSeconds(0)).toBe(0);
    expect(ticksToSeconds(10000000)).toBe(1); // 1 second
    expect(ticksToSeconds(72000000000)).toBe(7200); // 2 hours
  });

  it('fetches and maps user media libraries', async () => {
    const libraries = await mediaService.getUserViews(serverUrl, userId, token);

    expect(libraries).toHaveLength(3);
    expect(libraries[0]?.name).toBe('Movies');
    expect(libraries[0]?.collectionType).toBe('movies');
    expect(libraries[1]?.name).toBe('TV Shows');
    expect(libraries[2]?.name).toBe('Anime');
  });

  it('fetches and paginates media items with page calculations', async () => {
    const resultPage1 = await mediaService.getItems(serverUrl, userId, token, {
      startIndex: 0,
      limit: 20,
    });

    expect(resultPage1.items).toHaveLength(20);
    expect(resultPage1.totalCount).toBe(60);
    expect(resultPage1.currentPage).toBe(1);
    expect(resultPage1.totalPages).toBe(3);
    expect(resultPage1.hasNextPage).toBe(true);
    expect(resultPage1.hasPreviousPage).toBe(false);

    const resultPage2 = await mediaService.getItems(serverUrl, userId, token, {
      startIndex: 20,
      limit: 20,
    });

    expect(resultPage2.currentPage).toBe(2);
    expect(resultPage2.hasNextPage).toBe(true);
    expect(resultPage2.hasPreviousPage).toBe(true);
  });

  it('fetches single item metadata with cast, crew, and runtime', async () => {
    const item = await mediaService.getItem(serverUrl, userId, 'movie-item-1', token);

    expect(item.name).toBe('Inception');
    expect(item.originalTitle).toBe('Inception (Original)');
    expect(item.productionYear).toBe(2010);
    expect(item.communityRating).toBe(8.8);
    expect(item.runTimeSeconds).toBe(8880);
    expect(item.playbackPositionSeconds).toBe(2400);
    expect(item.people).toHaveLength(2);
    expect(item.people[0]?.name).toBe('Christopher Nolan');
  });

  it('fetches resume continue-watching items', async () => {
    const resumeItems = await mediaService.getResumeItems(serverUrl, userId, token, 5);

    expect(resumeItems).toHaveLength(1);
    expect(resumeItems[0]?.name).toBe('Inception');
    expect(resumeItems[0]?.playbackPositionSeconds).toBe(2400);
  });

  it('fetches recently added latest media items', async () => {
    const latestItems = await mediaService.getRecentlyAdded(serverUrl, userId, token, { limit: 10 });

    expect(latestItems).toHaveLength(10);
    expect(latestItems[0]?.name).toBe('Cinematic Film 1');
  });

  it('fetches genres and collections', async () => {
    const genres = await mediaService.getGenres(serverUrl, userId, token);
    expect(genres).toHaveLength(3);
    expect(genres[0]?.name).toBe('Action');

    const collections = await mediaService.getCollections(serverUrl, userId, token);
    expect(collections).toHaveLength(1);
    expect(collections[0]?.name).toBe('Dark Knight Trilogy');
  });

  it('handles empty results and calculates single-page pagination cleanly', () => {
    const paged = mapQueryResultToPagedResult({ Items: [], TotalRecordCount: 0 }, (x) => x, 20);
    expect(paged.items).toEqual([]);
    expect(paged.totalCount).toBe(0);
    expect(paged.currentPage).toBe(1);
    expect(paged.totalPages).toBe(1);
    expect(paged.hasNextPage).toBe(false);
    expect(paged.hasPreviousPage).toBe(false);
  });
});
