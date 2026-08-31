import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuthStore } from '../state/stores/useAuthStore';
import { mediaService, type GetItemsOptions } from '../api/services/mediaService';
import { queryKeys, type LibraryItemsQueryKeyParams } from '../state/query/queryKeys';
import type {
  LibraryView,
  MediaItem,
  PagedResult,
  GenreItem,
  MediaCollection,
} from '../domain/media/types';

export function useActiveSessionContext() {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;

  return {
    session,
    isAuthenticated,
    serverUrl: session?.serverUrl || '',
    userId: session?.user?.id || '',
    serverId: session?.serverId || '',
    token: session?.accessToken || '',
  };
}

/**
 * Hook to retrieve user's media libraries (Views).
 */
export function useUserLibraries() {
  const { serverUrl, userId, serverId, token, isAuthenticated } = useActiveSessionContext();

  return useQuery<LibraryView[], Error>({
    queryKey: queryKeys.server(serverId).user(userId).libraries(),
    queryFn: ({ signal }) => mediaService.getUserViews(serverUrl, userId, token, signal),
    enabled: isAuthenticated && !!serverUrl && !!userId && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to retrieve media items within a library with server-side pagination.
 */
export function useLibraryItems(
  libraryId: string,
  page = 1,
  pageSize = 30,
  options: Omit<GetItemsOptions, 'parentId' | 'startIndex' | 'limit'> = {}
) {
  const { serverUrl, userId, serverId, token, isAuthenticated } = useActiveSessionContext();
  const startIndex = (page - 1) * pageSize;

  const queryParams: LibraryItemsQueryKeyParams = {
    page,
    pageSize,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    genre: options.genres,
    searchTerm: options.searchTerm,
  };

  return useQuery<PagedResult<MediaItem>, Error>({
    queryKey: queryKeys.server(serverId).user(userId).libraryItems(libraryId, queryParams),
    queryFn: ({ signal }) =>
      mediaService.getItems(
        serverUrl,
        userId,
        token,
        {
          ...options,
          parentId: libraryId,
          startIndex,
          limit: pageSize,
        },
        signal
      ),
    enabled: isAuthenticated && !!serverUrl && !!userId && !!token && !!libraryId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to retrieve single media item metadata.
 */
export function useItemDetails(itemId: string) {
  const { serverUrl, userId, serverId, token, isAuthenticated } = useActiveSessionContext();

  return useQuery<MediaItem, Error>({
    queryKey: queryKeys.server(serverId).user(userId).item(itemId),
    queryFn: ({ signal }) => mediaService.getItem(serverUrl, userId, itemId, token, signal),
    enabled: isAuthenticated && !!serverUrl && !!userId && !!token && !!itemId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to retrieve in-progress resume media (Continue Watching).
 */
export function useResumeItems(limit = 12) {
  const { serverUrl, userId, serverId, token, isAuthenticated } = useActiveSessionContext();

  return useQuery<MediaItem[], Error>({
    queryKey: queryKeys.server(serverId).user(userId).resume(limit),
    queryFn: ({ signal }) => mediaService.getResumeItems(serverUrl, userId, token, limit, signal),
    enabled: isAuthenticated && !!serverUrl && !!userId && !!token,
    staleTime: 1000 * 30, // 30 seconds for resume progress accuracy
  });
}

/**
 * Hook to retrieve recently added media.
 */
export function useRecentlyAdded(parentId?: string, limit = 16) {
  const { serverUrl, userId, serverId, token, isAuthenticated } = useActiveSessionContext();

  return useQuery<MediaItem[], Error>({
    queryKey: queryKeys.server(serverId).user(userId).recentlyAdded(parentId, limit),
    queryFn: ({ signal }) =>
      mediaService.getRecentlyAdded(serverUrl, userId, token, { parentId, limit }, signal),
    enabled: isAuthenticated && !!serverUrl && !!userId && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to retrieve available genres.
 */
export function useGenres(parentId?: string) {
  const { serverUrl, userId, serverId, token, isAuthenticated } = useActiveSessionContext();

  return useQuery<GenreItem[], Error>({
    queryKey: queryKeys.server(serverId).user(userId).genres(parentId),
    queryFn: ({ signal }) => mediaService.getGenres(serverUrl, userId, token, parentId, signal),
    enabled: isAuthenticated && !!serverUrl && !!userId && !!token,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to retrieve media collections.
 */
export function useCollections() {
  const { serverUrl, userId, serverId, token, isAuthenticated } = useActiveSessionContext();

  return useQuery<MediaCollection[], Error>({
    queryKey: queryKeys.server(serverId).user(userId).collections(),
    queryFn: ({ signal }) => mediaService.getCollections(serverUrl, userId, token, signal),
    enabled: isAuthenticated && !!serverUrl && !!userId && !!token,
    staleTime: 1000 * 60 * 10,
  });
}
