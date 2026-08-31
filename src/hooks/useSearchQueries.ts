import * as React from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useActiveSessionContext } from './useMediaQueries';
import { searchService } from '../api/services/searchService';
import { queryKeys } from '../state/query/queryKeys';
import type { SearchFilters } from '../domain/search/types';
import type { MediaItem, PagedResult } from '../domain/media/types';

/**
 * Custom hook for debouncing search input changes.
 */
export function useSearchDebounce<T>(value: T, delayMs = 350): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook to execute server-side search and filtering queries.
 */
export function useSearchMedia(filters: SearchFilters, options: { enabled?: boolean } = {}) {
  const { serverUrl, userId, serverId, token, isAuthenticated } = useActiveSessionContext();

  const hasSearchCriteria =
    Boolean(filters.query?.trim()) ||
    Boolean(filters.genre) ||
    Boolean(filters.mediaType && filters.mediaType !== 'All') ||
    filters.year !== undefined ||
    filters.isPlayed !== undefined ||
    filters.isFavorite !== undefined;

  const isEnabled =
    (options.enabled ?? true) &&
    isAuthenticated &&
    !!serverUrl &&
    !!userId &&
    !!token &&
    hasSearchCriteria;

  return useQuery<PagedResult<MediaItem>, Error>({
    queryKey: queryKeys.server(serverId).user(userId).search(filters),
    queryFn: ({ signal }) => searchService.search(serverUrl, userId, token, filters, signal),
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
