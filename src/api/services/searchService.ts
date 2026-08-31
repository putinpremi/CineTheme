import { httpClient } from '../client/httpClient';
import type { BaseItemDto, QueryResultDto } from '../types/jellyfinDto';
import {
  mapBaseItemDtoToDomain,
  mapQueryResultToPagedResult,
} from '../../domain/media/mappers';
import type { MediaItem, PagedResult } from '../../domain/media/types';
import type { SearchFilters, SearchMediaType } from '../../domain/search/types';

function mapMediaTypeToJellyfinTypes(mediaType?: SearchMediaType): string | undefined {
  switch (mediaType) {
    case 'Movie':
      return 'Movie';
    case 'Series':
      return 'Series';
    case 'Season':
      return 'Season';
    case 'Episode':
      return 'Episode';
    case 'All':
      return 'Movie,Series,Season,Episode';
    default:
      return undefined;
  }
}

export class SearchService {
  /**
   * Performs server-side search and filtering across user media.
   */
  public async search(
    serverUrl: string,
    userId: string,
    token: string,
    filters: SearchFilters,
    signal?: AbortSignal
  ): Promise<PagedResult<MediaItem>> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 24;
    const startIndex = (page - 1) * pageSize;

    const includeItemTypes = mapMediaTypeToJellyfinTypes(filters.mediaType);

    const filterFlags: string[] = [];
    if (filters.isFavorite) {
      filterFlags.push('IsFavorite');
    }
    if (filters.isPlayed === true) {
      filterFlags.push('IsPlayed');
    } else if (filters.isPlayed === false) {
      filterFlags.push('IsUnplayed');
    }

    const defaultFields =
      'Overview,Genres,People,Studios,RunTimeTicks,PrimaryImageAspectRatio,Path,MediaStreams';

    const trimmedQuery = filters.query?.trim();

    const queryParams: Record<string, string | number | boolean | undefined> = {
      SearchTerm: trimmedQuery || undefined,
      IncludeItemTypes: includeItemTypes,
      Recursive: true,
      Genres: filters.genre,
      Years: filters.year ? String(filters.year) : undefined,
      Filters: filterFlags.length > 0 ? filterFlags.join(',') : undefined,
      SortBy: filters.sortBy ?? 'SortName',
      SortOrder: filters.sortOrder ?? 'Ascending',
      StartIndex: startIndex,
      Limit: pageSize,
      Fields: defaultFields,
    };

    const result = await httpClient.get<QueryResultDto<BaseItemDto>>(
      serverUrl,
      `/Users/${userId}/Items`,
      {
        token,
        queryParams,
        signal,
      }
    );

    return mapQueryResultToPagedResult(
      result,
      (dto) => mapBaseItemDtoToDomain(dto, serverUrl),
      pageSize
    );
  }
}

export const searchService = new SearchService();
