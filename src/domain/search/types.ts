export type SearchMediaType = 'All' | 'Movie' | 'Series' | 'Season' | 'Episode';

export type SearchSortBy = 'SortName' | 'DateCreated' | 'PremiereDate' | 'CommunityRating';

export type SearchSortOrder = 'Ascending' | 'Descending';

export interface SearchFilters {
  query: string;
  mediaType?: SearchMediaType;
  genre?: string;
  year?: number;
  isPlayed?: boolean;
  isFavorite?: boolean;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  page?: number;
  pageSize?: number;
}

export interface SearchQueryParams {
  q?: string;
  type?: string;
  genre?: string;
  year?: string;
  played?: string;
  favorite?: string;
  sort?: string;
  order?: string;
  page?: string;
}
