export type MediaItemType =
  | 'Movie'
  | 'Series'
  | 'Season'
  | 'Episode'
  | 'CollectionFolder'
  | 'BoxSet'
  | 'Folder'
  | 'Other';

export interface MediaStreamInfo {
  index: number;
  type: 'Video' | 'Audio' | 'Subtitle' | 'Attachment';
  codec: string;
  language?: string;
  title?: string;
  isDefault?: boolean;
  isForced?: boolean;
  channels?: number;
  sampleRate?: number;
  bitRate?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export interface ChapterInfo {
  name: string;
  startPositionTicks: number;
  startPositionSeconds: number;
  imageTag?: string;
}

export interface MediaPerson {
  id?: string;
  name: string;
  role?: string;
  type?: string;
  primaryImageTag?: string;
}

export interface LibraryView {
  id: string;
  name: string;
  collectionType?: string;
  primaryImageTag?: string;
  serverId: string;
}

export interface GenreItem {
  id: string;
  name: string;
  serverId: string;
}

export interface MediaCollection {
  id: string;
  name: string;
  overview?: string;
  primaryImageTag?: string;
  serverId: string;
}

export interface MediaItem {
  id: string;
  serverId: string;
  name: string;
  originalTitle?: string;
  sortName?: string;
  type: MediaItemType;
  collectionType?: string;
  overview?: string;
  taglines?: string[];
  productionYear?: number;
  premiereDate?: string;
  endDate?: string;
  communityRating?: number;
  officialRating?: string;
  runTimeTicks?: number;
  runTimeSeconds?: number;
  playbackPositionTicks?: number;
  playbackPositionSeconds?: number;
  isPlayed: boolean;
  isFavorite: boolean;
  playCount: number;
  genres: string[];
  studios: string[];
  people: MediaPerson[];
  primaryImageTag?: string;
  backdropImageTags: string[];
  logoImageTag?: string;
  primaryImageAspectRatio?: number;
  parentId?: string;
  seriesId?: string;
  seriesName?: string;
  seasonId?: string;
  seasonName?: string;
  indexNumber?: number;
  parentIndexNumber?: number;
  mediaStreams?: MediaStreamInfo[];
  chapters?: ChapterInfo[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  startIndex: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
