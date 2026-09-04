import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seerrService } from '../../src/api/services/seerrService';
import { useSeerrStore } from '../../src/state/stores/useSeerrStore';

describe('Jellyseerr / Seerr Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useSeerrStore.getState().disconnect();
    vi.restoreAllMocks();
  });

  describe('SeerrService', () => {
    it('testConnection validates server connectivity and extracts version', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '1.7.0', commitTag: 'v1.7.0' }),
      } as Response);

      const result = await seerrService.testConnection('http://jellyseerr.local:5055', 'test-api-key');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://jellyseerr.local:5055/api/v1/status',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Api-Key': 'test-api-key',
          }),
        })
      );
      expect(result.version).toBe('1.7.0');
    });

    it('testConnection throws error on unauthorized access', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(
        seerrService.testConnection('http://jellyseerr.local:5055', 'wrong-key')
      ).rejects.toThrow('Invalid API key or unauthorized access');
    });

    it('searchMedia maps TMDB movies and shows with correct status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          page: 1,
          totalPages: 1,
          totalResults: 2,
          results: [
            {
              id: 101,
              mediaType: 'movie',
              title: 'Inception',
              overview: 'Dream within a dream',
              posterPath: '/inception.jpg',
              releaseDate: '2010-07-16',
              mediaInfo: { status: 5 }, // AVAILABLE
            },
            {
              id: 202,
              mediaType: 'tv',
              name: 'Breaking Bad',
              overview: 'Chemistry teacher',
              posterPath: '/bb.jpg',
              firstAirDate: '2008-01-20',
              numberOfSeasons: 5,
              mediaInfo: { status: 2 }, // PENDING_APPROVAL
            },
          ],
        }),
      } as Response);

      const res = await seerrService.searchMedia('http://jellyseerr.local:5055', 'key-123', 'dream');

      expect(res.results).toHaveLength(2);
      expect(res.results[0]).toEqual({
        id: 101,
        mediaType: 'movie',
        title: 'Inception',
        overview: 'Dream within a dream',
        posterPath: 'https://image.tmdb.org/t/p/w500/inception.jpg',
        backdropPath: undefined,
        releaseDate: '2010-07-16',
        status: 'AVAILABLE',
        seasonsCount: undefined,
      });

      expect(res.results[1]!.title).toBe('Breaking Bad');
      expect(res.results[1]!.status).toBe('PENDING_APPROVAL');
      expect(res.results[1]!.seasonsCount).toBe(5);
    });

    it('requestMedia submits movie payload to /api/v1/request', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 55, media: { id: 101 } }),
      } as Response);

      const res = await seerrService.requestMedia('http://jellyseerr.local:5055', 'key-123', {
        mediaType: 'movie',
        mediaId: 101,
      });

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://jellyseerr.local:5055/api/v1/request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ mediaType: 'movie', mediaId: 101 }),
        })
      );
    });

    it('requestMedia submits series payload with selected seasons', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 56 }),
      } as Response);

      const res = await seerrService.requestMedia('http://jellyseerr.local:5055', 'key-123', {
        mediaType: 'tv',
        mediaId: 202,
        seasons: [1, 2],
      });

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://jellyseerr.local:5055/api/v1/request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ mediaType: 'tv', mediaId: 202, seasons: [1, 2] }),
        })
      );
    });
  });

  describe('useSeerrStore', () => {
    it('persists credentials and updates status on successful testConnection', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '2.1.0' }),
      } as Response);

      const store = useSeerrStore.getState();
      store.setServerUrl('http://seerr.home:5055');
      store.setApiKey('secret-key');
      store.setEnabled(true);

      expect(useSeerrStore.getState().serverUrl).toBe('http://seerr.home:5055');
      expect(useSeerrStore.getState().apiKey).toBe('secret-key');
      expect(useSeerrStore.getState().enabled).toBe(true);

      const success = await store.testConnection();

      expect(success).toBe(true);
      expect(useSeerrStore.getState().status).toBe('connected');
      expect(useSeerrStore.getState().version).toBe('2.1.0');

      // Test disconnect resets state and storage
      store.disconnect();
      expect(useSeerrStore.getState().enabled).toBe(false);
      expect(useSeerrStore.getState().serverUrl).toBe('');
      expect(useSeerrStore.getState().apiKey).toBe('');
      expect(useSeerrStore.getState().status).toBe('idle');
    });
  });
});
