import type { SearchFilters } from '../../domain/search/types';

export interface LibraryItemsQueryKeyParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'Ascending' | 'Descending';
  genre?: string;
  searchTerm?: string;
}

export const queryKeys = {
  all: ['cinetheme'] as const,
  server: (serverId: string) => ({
    all: ['cinetheme', 'server', serverId] as const,
    user: (userId: string) => ({
      all: ['cinetheme', 'server', serverId, 'user', userId] as const,
      libraries: () => ['cinetheme', 'server', serverId, 'user', userId, 'libraries'] as const,
      libraryItems: (libraryId: string, params: LibraryItemsQueryKeyParams = {}) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'library', libraryId, 'items', params] as const,
      item: (itemId: string) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'item', itemId] as const,
      chapters: (itemId: string) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'chapters', itemId] as const,
      introSkipper: (itemId: string) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'introskipper', itemId] as const,
      episodes: (seriesId: string, seasonId?: string) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'series', seriesId, 'season', seasonId, 'episodes'] as const,
      adjacentEpisodes: (seriesId: string, seasonId: string | undefined, currentEpisodeId: string) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'series', seriesId, 'season', seasonId, 'adjacent', currentEpisodeId] as const,
      trickplay: (itemId: string, width = 320) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'trickplay', itemId, width] as const,
      resume: (limit?: number) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'resume', { limit }] as const,
      recentlyAdded: (parentId?: string, limit?: number) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'recentlyAdded', { parentId, limit }] as const,
      genres: (parentId?: string) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'genres', { parentId }] as const,
      collections: () =>
        ['cinetheme', 'server', serverId, 'user', userId, 'collections'] as const,
      search: (filters: SearchFilters) =>
        ['cinetheme', 'server', serverId, 'user', userId, 'search', filters] as const,
    }),
  }),
};
