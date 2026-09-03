import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { MediaCard } from '../components/media/MediaCard';
import { PaginationControls } from '../components/media/PaginationControls';
import { useSearchMedia, useSearchDebounce } from '../hooks/useSearchQueries';
import { useGenres } from '../hooks/useMediaQueries';
import type {
  SearchFilters,
  SearchMediaType,
  SearchSortBy,
  SearchSortOrder,
} from '../domain/search/types';
import {
  Search,
  X,
  SlidersHorizontal,
  Film,
  Tv,
  ListFilter,
  ArrowUpDown,
  Sparkles,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../utils/cn';

const MEDIA_TYPES: { label: string; value: SearchMediaType; icon?: React.ReactNode }[] = [
  { label: 'All', value: 'All' },
  { label: 'Movies', value: 'Movie', icon: <Film className="h-3.5 w-3.5" /> },
  { label: 'TV Shows', value: 'Series', icon: <Tv className="h-3.5 w-3.5" /> },
  { label: 'Seasons', value: 'Season' },
  { label: 'Episodes', value: 'Episode' },
];

const SORT_OPTIONS: { label: string; sortBy: SearchSortBy; sortOrder: SearchSortOrder }[] = [
  { label: 'Name (A-Z)', sortBy: 'SortName', sortOrder: 'Ascending' },
  { label: 'Name (Z-A)', sortBy: 'SortName', sortOrder: 'Descending' },
  { label: 'Highest Rated', sortBy: 'CommunityRating', sortOrder: 'Descending' },
  { label: 'Recently Added', sortBy: 'DateCreated', sortOrder: 'Descending' },
  { label: 'Release Date (Newest)', sortBy: 'PremiereDate', sortOrder: 'Descending' },
  { label: 'Release Date (Oldest)', sortBy: 'PremiereDate', sortOrder: 'Ascending' },
];

export function SearchView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const urlType = (searchParams.get('type') as SearchMediaType) || 'All';
  const urlGenre = searchParams.get('genre') || '';
  const urlYear = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
  const urlSort = (searchParams.get('sort') as SearchSortBy) || 'SortName';
  const urlOrder = (searchParams.get('order') as SearchSortOrder) || 'Ascending';
  const urlFavorite = searchParams.get('favorite') === 'true';
  const urlPlayed =
    searchParams.get('played') === 'true'
      ? true
      : searchParams.get('played') === 'false'
      ? false
      : undefined;
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(urlPage) || urlPage < 1 ? 1 : urlPage;

  const [inputQuery, setInputQuery] = React.useState(urlQuery);
  const [showFilters, setShowFilters] = React.useState(false);
  const debouncedQuery = useSearchDebounce(inputQuery, 350);

  // Sync debounced input with URL
  React.useEffect(() => {
    const trimmedDebounced = debouncedQuery.trim();
    const trimmedUrl = urlQuery.trim();

    // Only push to URL when debounce has settled with the current input
    if (debouncedQuery === inputQuery && trimmedDebounced !== trimmedUrl) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (trimmedDebounced) {
            next.set('q', trimmedDebounced);
          } else {
            next.delete('q');
          }
          next.set('page', '1');
          return next;
        },
        { replace: true }
      );
    }
  }, [debouncedQuery, inputQuery, urlQuery, setSearchParams]);

  // Keep inputQuery in sync if urlQuery changes via back/forward navigation
  const prevUrlQueryRef = React.useRef(urlQuery);
  React.useEffect(() => {
    if (prevUrlQueryRef.current !== urlQuery) {
      prevUrlQueryRef.current = urlQuery;
      setInputQuery(urlQuery);
    }
  }, [urlQuery]);

  const { data: genresList } = useGenres();

  const searchFilters: SearchFilters = React.useMemo(
    () => ({
      query: urlQuery,
      mediaType: urlType,
      genre: urlGenre || undefined,
      year: urlYear,
      sortBy: urlSort,
      sortOrder: urlOrder,
      isFavorite: urlFavorite || undefined,
      isPlayed: urlPlayed,
      page,
      pageSize: 24,
    }),
    [urlQuery, urlType, urlGenre, urlYear, urlSort, urlOrder, urlFavorite, urlPlayed, page]
  );

  const hasSearchCriteria =
    Boolean(urlQuery.trim()) ||
    Boolean(urlGenre) ||
    (urlType !== 'All' && Boolean(urlType)) ||
    urlYear !== undefined ||
    urlFavorite ||
    urlPlayed !== undefined;

  const {
    data: searchResults,
    isLoading,
    isError,
    error,
    refetch,
  } = useSearchMedia(searchFilters);

  const handleUpdateParam = (key: string, value: string | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleMediaTypeChange = (type: SearchMediaType) => {
    handleUpdateParam('type', type === 'All' ? undefined : type);
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleUpdateParam('genre', e.target.value || undefined);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIdx = parseInt(e.target.value, 10);
    const sortConfig = SORT_OPTIONS[selectedIdx];
    if (sortConfig) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sort', sortConfig.sortBy);
        next.set('order', sortConfig.sortOrder);
        next.set('page', '1');
        return next;
      });
    }
  };

  const handleToggleFavorite = () => {
    handleUpdateParam('favorite', urlFavorite ? undefined : 'true');
  };

  const handleToggleUnplayed = () => {
    handleUpdateParam('played', urlPlayed === false ? undefined : 'false');
  };

  const handleClearAll = () => {
    setInputQuery('');
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSortIndex = SORT_OPTIONS.findIndex(
    (s) => s.sortBy === urlSort && s.sortOrder === urlOrder
  );

  const hasActiveFilters =
    urlType !== 'All' ||
    Boolean(urlGenre) ||
    urlYear !== undefined ||
    urlFavorite ||
    urlPlayed !== undefined ||
    urlSort !== 'SortName' ||
    urlOrder !== 'Ascending';

  return (
    <div className="py-8 sm:py-10 space-y-8 min-h-[calc(100vh-4rem)]">
      <Container>
        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-50 font-display">
              Explore & Search
            </h1>
            <p className="text-xs sm:text-sm text-surface-400 mt-1">
              Find movies, series, episodes, and collections across your connected Jellyfin server.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters((prev) => !prev)}
            className="sm:hidden gap-2"
            aria-label="Toggle search filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters {hasActiveFilters ? '(Active)' : ''}</span>
          </Button>
        </div>

        {/* Search Input Bar */}
        <div className="pt-4 space-y-4">
          <div className="relative max-w-3xl">
            <Input
              type="search"
              placeholder="Search by title, original name, actor, director, or keyword..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setInputQuery('');
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('q');
                    next.set('page', '1');
                    return next;
                  });
                }
              }}
              leftIcon={<Search className="h-5 w-5 text-brand-400" />}
              rightIcon={
                inputQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setInputQuery('');
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.delete('q');
                        next.set('page', '1');
                        return next;
                      });
                    }}
                    className="p-1 rounded text-surface-400 hover:text-surface-100 transition-colors focus-ring"
                    aria-label="Clear search input"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : undefined
              }
              className="h-12 sm:h-14 text-base bg-surface-900/90 border-surface-750 focus:border-brand-500 rounded-xl shadow-lg"
              autoFocus
            />
          </div>

          {/* Media Type Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MEDIA_TYPES.map((type) => {
              const isSelected = urlType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleMediaTypeChange(type.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap focus-ring cursor-pointer select-none',
                    isSelected
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50 shadow-sm font-semibold'
                      : 'bg-surface-900 border border-surface-800 text-surface-300 hover:bg-surface-850 hover:text-surface-50'
                  )}
                  aria-pressed={isSelected}
                >
                  {type.icon}
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Advanced Filter Panel (Collapsible on Mobile, Expanded on Desktop) */}
          <div
            className={cn(
              'pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-surface-900/60 p-4 rounded-xl border border-surface-800/80 transition-all',
              showFilters ? 'block' : 'hidden sm:grid'
            )}
          >
            {/* Genre Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="genre-filter" className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                <ListFilter className="h-3.5 w-3.5 text-brand-400" />
                <span>Genre</span>
              </label>
              <select
                id="genre-filter"
                value={urlGenre}
                onChange={handleGenreChange}
                className="w-full h-9 rounded-lg bg-surface-850 border border-surface-750 px-3 text-xs text-surface-200 focus-ring cursor-pointer"
              >
                <option value="">All Genres</option>
                {(genresList || []).map((genre) => (
                  <option key={genre.id} value={genre.name}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="sort-filter" className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-brand-400" />
                <span>Sort By</span>
              </label>
              <select
                id="sort-filter"
                value={activeSortIndex >= 0 ? activeSortIndex : 0}
                onChange={handleSortChange}
                className="w-full h-9 rounded-lg bg-surface-850 border border-surface-750 px-3 text-xs text-surface-200 focus-ring cursor-pointer"
              >
                {SORT_OPTIONS.map((sortOpt, idx) => (
                  <option key={idx} value={idx}>
                    {sortOpt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Toggle Filters */}
            <div className="space-y-1.5 sm:col-span-2 flex flex-wrap items-end gap-2 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors focus-ring',
                  urlFavorite
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                    : 'bg-surface-850 border-surface-750 text-surface-400 hover:text-surface-200'
                )}
                aria-pressed={urlFavorite}
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>Favorites</span>
              </button>

              <button
                type="button"
                onClick={handleToggleUnplayed}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors focus-ring',
                  urlPlayed === false
                    ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-semibold'
                    : 'bg-surface-850 border-surface-750 text-surface-400 hover:text-surface-200'
                )}
                aria-pressed={urlPlayed === false}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Unwatched</span>
              </button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-surface-400 hover:text-surface-100 ml-auto"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="pt-6 space-y-6">
          {/* Error State */}
          {isError ? (
            <ErrorState
              title="Search Request Failed"
              message={error?.message || 'Could not fetch search results from Jellyfin.'}
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            /* Loading Skeleton Grid */
            <div className="space-y-4">
              <div className="h-4 w-44 rounded bg-surface-800 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="space-y-2">
                    <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : searchResults && searchResults.items.length > 0 ? (
            /* Successful Results Grid */
            <div className="space-y-6">
              <div className="flex items-baseline justify-between text-xs sm:text-sm text-surface-400">
                <span>
                  Found <span className="font-semibold text-surface-100">{searchResults.totalCount}</span> results
                  {urlQuery ? (
                    <span>
                      {' '}for <span className="font-semibold text-brand-300">"{urlQuery}"</span>
                    </span>
                  ) : null}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.items.map((item) => (
                  <MediaCard key={item.id} item={item} aspectRatio="poster" />
                ))}
              </div>

              <PaginationControls
                currentPage={searchResults.currentPage}
                totalPages={searchResults.totalPages}
                totalCount={searchResults.totalCount}
                pageSize={searchResults.pageSize}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          ) : hasSearchCriteria ? (
            /* Zero Results Empty State */
            <EmptyState
              icon={<Search className="h-8 w-8 text-brand-400" />}
              title="No Results Found"
              description={`No media items matched your search criteria${
                urlQuery ? ` for "${urlQuery}"` : ''
              }. Try adjusting your filters or keyword query.`}
            />
          ) : (
            /* Initial Search Prompt */
            <EmptyState
              icon={<Sparkles className="h-8 w-8 text-brand-400" />}
              title="Discover Your Media"
              description="Type a movie or series title, actor name, director, or select a genre above to start exploring."
            />
          )}
        </div>
      </Container>
    </div>
  );
}
