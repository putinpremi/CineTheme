import type { BaseItemDto, QueryResultDto } from '../../api/types/jellyfinDto';
import type {
  MediaItem,
  MediaItemType,
  LibraryView,
  GenreItem,
  MediaCollection,
  PagedResult,
  MediaPerson,
} from './types';
import { InvalidResponseError } from '../../core/errors/AppError';

export function ticksToSeconds(ticks?: number): number {
  if (!ticks || typeof ticks !== 'number' || ticks <= 0) return 0;
  return Math.round(ticks / 10000000);
}

export function mapBaseItemType(rawType?: string): MediaItemType {
  switch (rawType) {
    case 'Movie':
      return 'Movie';
    case 'Series':
      return 'Series';
    case 'Season':
      return 'Season';
    case 'Episode':
      return 'Episode';
    case 'CollectionFolder':
    case 'UserView':
      return 'CollectionFolder';
    case 'BoxSet':
      return 'BoxSet';
    case 'Folder':
      return 'Folder';
    default:
      return 'Other';
  }
}

export function mapBaseItemDtoToDomain(dto: BaseItemDto, serverId: string): MediaItem {
  if (!dto.Id) {
    throw new InvalidResponseError('Media item is missing required Id.');
  }

  const primaryImageTag = dto.ImageTags?.Primary;
  const backdropImageTags = dto.BackdropImageTags || (dto.ImageTags?.Backdrop ? [dto.ImageTags.Backdrop] : []);
  const logoImageTag = dto.ImageTags?.Logo;

  const people: MediaPerson[] = (dto.People || []).map((p) => ({
    id: p.Id,
    name: p.Name || 'Unknown Person',
    role: p.Role,
    type: p.Type,
    primaryImageTag: p.PrimaryImageTag,
  }));

  const studios = (dto.Studios || []).map((s) => s.Name || '').filter(Boolean);

  const runTimeSeconds = ticksToSeconds(dto.RunTimeTicks);
  const playbackPositionSeconds = ticksToSeconds(dto.UserData?.PlaybackPositionTicks);

  return {
    id: dto.Id,
    serverId: dto.ServerId || serverId,
    name: dto.Name || 'Untitled',
    originalTitle: dto.OriginalTitle,
    type: mapBaseItemType(dto.Type),
    collectionType: dto.CollectionType,
    overview: dto.Overview,
    taglines: dto.Taglines,
    productionYear: dto.ProductionYear,
    premiereDate: dto.PremiereDate,
    endDate: dto.EndDate,
    communityRating: dto.CommunityRating,
    officialRating: dto.OfficialRating,
    runTimeTicks: dto.RunTimeTicks,
    runTimeSeconds,
    playbackPositionTicks: dto.UserData?.PlaybackPositionTicks ?? 0,
    playbackPositionSeconds,
    isPlayed: dto.UserData?.Played ?? false,
    isFavorite: dto.UserData?.IsFavorite ?? false,
    playCount: dto.UserData?.PlayCount ?? 0,
    genres: dto.Genres || [],
    studios,
    people,
    primaryImageTag,
    backdropImageTags,
    logoImageTag,
    primaryImageAspectRatio: dto.PrimaryImageAspectRatio,
    parentId: dto.ParentId,
    seriesId: dto.SeriesId,
    seriesName: dto.SeriesName,
    seasonId: dto.SeasonId,
    seasonName: dto.SeasonName,
    indexNumber: dto.IndexNumber,
    parentIndexNumber: dto.ParentIndexNumber,
  };
}

export function mapUserViewDtoToLibrary(dto: BaseItemDto, serverId: string): LibraryView {
  if (!dto.Id) {
    throw new InvalidResponseError('Library view is missing required Id.');
  }

  return {
    id: dto.Id,
    name: dto.Name || 'Unnamed Library',
    collectionType: dto.CollectionType,
    primaryImageTag: dto.ImageTags?.Primary,
    serverId: dto.ServerId || serverId,
  };
}

export function mapGenreDtoToDomain(dto: { Id?: string; Name?: string }, serverId: string): GenreItem {
  if (!dto.Id) {
    throw new InvalidResponseError('Genre item is missing required Id.');
  }

  return {
    id: dto.Id,
    name: dto.Name || 'Unknown Genre',
    serverId,
  };
}

export function mapCollectionDtoToDomain(dto: BaseItemDto, serverId: string): MediaCollection {
  if (!dto.Id) {
    throw new InvalidResponseError('Collection item is missing required Id.');
  }

  return {
    id: dto.Id,
    name: dto.Name || 'Unnamed Collection',
    overview: dto.Overview,
    primaryImageTag: dto.ImageTags?.Primary,
    serverId: dto.ServerId || serverId,
  };
}

export function mapQueryResultToPagedResult<T, R>(
  result: QueryResultDto<T>,
  mapper: (item: T) => R,
  pageSize: number
): PagedResult<R> {
  const items = (result.Items || []).map(mapper);
  const totalCount = result.TotalRecordCount ?? items.length;
  const startIndex = result.StartIndex ?? 0;
  const effectivePageSize = pageSize > 0 ? pageSize : items.length || 1;

  const currentPage = Math.floor(startIndex / effectivePageSize) + 1;
  const totalPages = Math.ceil(totalCount / effectivePageSize) || 1;

  return {
    items,
    totalCount,
    startIndex,
    pageSize: effectivePageSize,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}
