import { httpClient } from '../client/httpClient';
import type { BaseItemDto, QueryResultDto } from '../types/jellyfinDto';
import {
  mapBaseItemDtoToDomain,
  mapUserViewDtoToLibrary,
  mapGenreDtoToDomain,
  mapCollectionDtoToDomain,
  mapQueryResultToPagedResult,
} from '../../domain/media/mappers';
import type {
  MediaItem,
  LibraryView,
  GenreItem,
  MediaCollection,
  PagedResult,
} from '../../domain/media/types';

export interface GetItemsOptions {
  parentId?: string;
  startIndex?: number;
  limit?: number;
  recursive?: boolean;
  sortBy?: string;
  sortOrder?: 'Ascending' | 'Descending';
  includeItemTypes?: string;
  genres?: string;
  searchTerm?: string;
  fields?: string;
}

export class MediaService {
  /**
   * Retrieves user's top-level media libraries/views.
   */
  public async getUserViews(
    serverUrl: string,
    userId: string,
    token: string,
    signal?: AbortSignal
  ): Promise<LibraryView[]> {
    const result = await httpClient.get<QueryResultDto<BaseItemDto>>(
      serverUrl,
      `/Users/${userId}/Views`,
      { token, signal }
    );

    return (result.Items || []).map((item) => mapUserViewDtoToLibrary(item, serverUrl));
  }

  /**
   * Retrieves media items with server-side pagination, sorting, and filtering.
   */
  public async getItems(
    serverUrl: string,
    userId: string,
    token: string,
    options: GetItemsOptions = {},
    signal?: AbortSignal
  ): Promise<PagedResult<MediaItem>> {
    const pageSize = options.limit ?? 50;
    const defaultFields =
      'Overview,Genres,People,Studios,RunTimeTicks,PrimaryImageAspectRatio,Path,MediaStreams';

    const queryParams: Record<string, string | number | boolean | undefined> = {
      ParentId: options.parentId,
      StartIndex: options.startIndex ?? 0,
      Limit: pageSize,
      Recursive: options.recursive ?? true,
      SortBy: options.sortBy ?? 'SortName,ProductionYear',
      SortOrder: options.sortOrder ?? 'Ascending',
      IncludeItemTypes: options.includeItemTypes,
      Genres: options.genres,
      SearchTerm: options.searchTerm,
      Fields: options.fields ?? defaultFields,
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

  /**
   * Retrieves metadata for a single media item.
   */
  public async getItem(
    serverUrl: string,
    userId: string,
    itemId: string,
    token: string,
    signal?: AbortSignal
  ): Promise<MediaItem> {
    const dto = await httpClient.get<BaseItemDto>(
      serverUrl,
      `/Users/${userId}/Items/${itemId}`,
      { token, signal }
    );

    return mapBaseItemDtoToDomain(dto, serverUrl);
  }

  /**
   * Retrieves in-progress resume items (Continue Watching).
   */
  public async getResumeItems(
    serverUrl: string,
    userId: string,
    token: string,
    limit = 12,
    signal?: AbortSignal
  ): Promise<MediaItem[]> {
    const defaultFields = 'Overview,PrimaryImageAspectRatio,RunTimeTicks,SeriesName,SeasonName';

    const result = await httpClient.get<QueryResultDto<BaseItemDto>>(
      serverUrl,
      `/Users/${userId}/Items/Resume`,
      {
        token,
        queryParams: {
          Limit: limit,
          MediaTypes: 'Video',
          Fields: defaultFields,
        },
        signal,
      }
    );

    return (result.Items || []).map((item) => mapBaseItemDtoToDomain(item, serverUrl));
  }

  /**
   * Retrieves recently ingested media items.
   */
  public async getRecentlyAdded(
    serverUrl: string,
    userId: string,
    token: string,
    options: { parentId?: string; limit?: number } = {},
    signal?: AbortSignal
  ): Promise<MediaItem[]> {
    const limit = options.limit ?? 16;
    const defaultFields = 'Overview,PrimaryImageAspectRatio,RunTimeTicks';

    const items = await httpClient.get<BaseItemDto[]>(
      serverUrl,
      `/Users/${userId}/Items/Latest`,
      {
        token,
        queryParams: {
          ParentId: options.parentId,
          Limit: limit,
          Fields: defaultFields,
        },
        signal,
      }
    );

    return (items || []).map((item) => mapBaseItemDtoToDomain(item, serverUrl));
  }

  /**
   * Retrieves available genres.
   */
  public async getGenres(
    serverUrl: string,
    userId: string,
    token: string,
    parentId?: string,
    signal?: AbortSignal
  ): Promise<GenreItem[]> {
    const result = await httpClient.get<QueryResultDto<{ Id?: string; Name?: string }>>(
      serverUrl,
      `/Users/${userId}/Genres`,
      {
        token,
        queryParams: {
          ParentId: parentId,
          SortBy: 'SortName',
          SortOrder: 'Ascending',
        },
        signal,
      }
    );

    return (result.Items || []).map((item) => mapGenreDtoToDomain(item, serverUrl));
  }

  /**
   * Retrieves media collections (BoxSets).
   */
  public async getCollections(
    serverUrl: string,
    userId: string,
    token: string,
    signal?: AbortSignal
  ): Promise<MediaCollection[]> {
    const result = await httpClient.get<QueryResultDto<BaseItemDto>>(
      serverUrl,
      `/Users/${userId}/Items`,
      {
        token,
        queryParams: {
          IncludeItemTypes: 'BoxSet',
          Recursive: true,
          SortBy: 'SortName',
          SortOrder: 'Ascending',
        },
        signal,
      }
    );

    return (result.Items || []).map((item) => mapCollectionDtoToDomain(item, serverUrl));
  }

  /**
   * Retrieves episodes for a TV Series or Season.
   */
  public async getEpisodes(
    serverUrl: string,
    userId: string,
    seriesId: string,
    token: string,
    seasonId?: string,
    signal?: AbortSignal
  ): Promise<MediaItem[]> {
    const defaultFields =
      'Overview,PrimaryImageAspectRatio,RunTimeTicks,SeriesName,SeasonName,IndexNumber,ParentIndexNumber';
    const queryParams: Record<string, string | number | boolean | undefined> = {
      userId,
      Fields: defaultFields,
    };
    if (seasonId) {
      queryParams.seasonId = seasonId;
    }

    const result = await httpClient.get<QueryResultDto<BaseItemDto>>(
      serverUrl,
      `/Shows/${encodeURIComponent(seriesId)}/Episodes`,
      {
        token,
        queryParams,
        signal,
      }
    );

    return (result.Items || []).map((item) => mapBaseItemDtoToDomain(item, serverUrl));
  }
}

export const mediaService = new MediaService();
