import { useSearchParams } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Compass, Film, Tv, Music, BookOpen, Layers, ArrowLeft } from 'lucide-react';
import { useUserLibraries, useLibraryItems } from '../hooks/useMediaQueries';
import { MediaCard } from '../components/media/MediaCard';
import { PaginationControls } from '../components/media/PaginationControls';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

function getLibraryIcon(collectionType?: string) {
  switch (collectionType) {
    case 'movies':
      return <Film className="h-6 w-6 text-brand-400" />;
    case 'tvshows':
      return <Tv className="h-6 w-6 text-purple-400" />;
    case 'music':
      return <Music className="h-6 w-6 text-emerald-400" />;
    case 'books':
      return <BookOpen className="h-6 w-6 text-amber-400" />;
    default:
      return <Layers className="h-6 w-6 text-brand-400" />;
  }
}

export function LibraryView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLibraryId = searchParams.get('id') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const {
    data: libraries,
    isLoading: isLibrariesLoading,
    isError: isLibrariesError,
    error: librariesError,
    refetch: refetchLibraries,
  } = useUserLibraries();

  const selectedLibrary = (libraries || []).find((lib) => lib.id === selectedLibraryId);

  const {
    data: pagedItems,
    isLoading: isItemsLoading,
    isError: isItemsError,
    error: itemsError,
    refetch: refetchItems,
  } = useLibraryItems(selectedLibraryId, page, 24);

  const handleSelectLibrary = (id: string) => {
    setSearchParams({ id, page: '1' });
  };

  const handleClearLibrary = () => {
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ id: selectedLibraryId, page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Error fetching libraries
  if (isLibrariesError) {
    return (
      <div className="py-12">
        <Container>
          <ErrorState
            title="Failed to Load Libraries"
            message={librariesError?.message || 'Could not fetch libraries from the Jellyfin server.'}
            onRetry={() => refetchLibraries()}
          />
        </Container>
      </div>
    );
  }

  // Loading libraries initial state
  if (isLibrariesLoading) {
    return (
      <div className="py-8 sm:py-10">
        <Container>
          <div className="space-y-6">
            <Skeleton className="h-8 w-48 rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-28 rounded-xl" />
              ))}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // If no libraries exist on the server
  if (!libraries || libraries.length === 0) {
    return (
      <div className="py-12">
        <Container>
          <EmptyState
            icon={<Compass className="h-8 w-8 text-brand-400" />}
            title="No Libraries Found"
            description="Your Jellyfin account does not have access to any media libraries."
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-10 space-y-8">
      <Container>
        {/* Header and Library Selection Bar */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-50 font-display">
                {selectedLibrary ? selectedLibrary.name : 'Media Libraries'}
              </h1>
              <p className="text-xs sm:text-sm text-surface-400 mt-1">
                {selectedLibrary
                  ? `Browsing ${selectedLibrary.collectionType || 'media'} items`
                  : 'Select a library to browse movies, TV shows, and series.'}
              </p>
            </div>

            {selectedLibrary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLibrary}
                className="gap-2 text-surface-300 hover:text-surface-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>All Libraries</span>
              </Button>
            )}
          </div>

          {/* Quick Library Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {libraries.map((lib) => {
              const isSelected = lib.id === selectedLibraryId;
              return (
                <button
                  key={lib.id}
                  onClick={() => handleSelectLibrary(lib.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap focus-ring cursor-pointer select-none',
                    isSelected
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm font-semibold'
                      : 'bg-surface-900 border border-surface-800 text-surface-300 hover:bg-surface-850 hover:text-surface-50'
                  )}
                >
                  {getLibraryIcon(lib.collectionType)}
                  <span>{lib.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Library Items Grid / Views */}
        {selectedLibraryId ? (
          <div className="space-y-6 pt-2">
            {isItemsError ? (
              <ErrorState
                title="Failed to Load Media Items"
                message={itemsError?.message || 'Could not load library contents.'}
                onRetry={() => refetchItems()}
              />
            ) : isItemsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="space-y-2">
                    <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                ))}
              </div>
            ) : pagedItems && pagedItems.items.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {pagedItems.items.map((item) => (
                    <MediaCard key={item.id} item={item} aspectRatio="poster" />
                  ))}
                </div>

                <PaginationControls
                  currentPage={pagedItems.currentPage}
                  totalPages={pagedItems.totalPages}
                  totalCount={pagedItems.totalCount}
                  pageSize={pagedItems.pageSize}
                  onPageChange={handlePageChange}
                  isLoading={isItemsLoading}
                />
              </>
            ) : (
              <EmptyState
                icon={<Film className="h-8 w-8 text-brand-400" />}
                title="Library is Empty"
                description={`No media items were found in ${selectedLibrary?.name || 'this library'}.`}
              />
            )}
          </div>
        ) : (
          /* When no library is selected, render full library cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
            {libraries.map((lib) => (
              <div
                key={lib.id}
                onClick={() => handleSelectLibrary(lib.id)}
                className="group relative flex flex-col rounded-2xl border border-surface-750/70 bg-gradient-to-br from-surface-850 to-surface-900/90 p-6 shadow-xl hover:border-brand-500/50 hover:shadow-brand-500/10 transition-all duration-300 cursor-pointer select-none focus-ring"
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectLibrary(lib.id);
                  }
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-800 border border-surface-700 group-hover:bg-brand-500/20 group-hover:border-brand-500/40 transition-colors">
                  {getLibraryIcon(lib.collectionType)}
                </div>
                <div className="mt-4 space-y-1 flex-1">
                  <h3 className="text-lg font-bold text-surface-50 group-hover:text-brand-300 transition-colors font-display">
                    {lib.name}
                  </h3>
                  <p className="text-xs text-surface-400 capitalize">
                    {lib.collectionType || 'Media Collection'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
