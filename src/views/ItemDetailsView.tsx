import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';
import { Play, ArrowLeft, Star, Clock, Calendar, ShieldAlert } from 'lucide-react';
import { useItemDetails } from '../hooks/useMediaQueries';
import { buildItemImageUrl } from '../api/client/imageUtils';
import { useAuthStore } from '../state/stores/useAuthStore';

function formatRuntime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

export function ItemDetailsView() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const serverUrl = session?.serverUrl || '';

  const {
    data: item,
    isLoading,
    isError,
    error,
    refetch,
  } = useItemDetails(itemId || '');

  if (isError) {
    return (
      <div className="py-12">
        <Container>
          <ErrorState
            title="Failed to Load Media Metadata"
            message={error?.message || 'Could not retrieve media details from Jellyfin.'}
            onRetry={() => refetch()}
          />
        </Container>
      </div>
    );
  }

  if (isLoading || !item) {
    return (
      <div className="py-8 sm:py-12">
        <Container>
          <div className="space-y-6">
            <Skeleton className="h-8 w-32 rounded-md" />
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="aspect-[2/3] w-full md:w-72 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-10 w-3/4 rounded-md" />
                <Skeleton className="h-6 w-1/3 rounded-md" />
                <Skeleton className="h-24 w-full rounded-md" />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const posterTag = item.primaryImageTag;
  const backdropTag = item.backdropImageTags[0] || item.primaryImageTag;

  const posterUrl = posterTag
    ? buildItemImageUrl(serverUrl, item.id, 'Primary', { tag: posterTag, quality: 90, maxWidth: 500 })
    : '';

  const backdropUrl = backdropTag
    ? buildItemImageUrl(serverUrl, item.id, 'Backdrop', { tag: backdropTag, quality: 85, maxWidth: 1920 })
    : '';

  const formattedRuntime = formatRuntime(item.runTimeSeconds);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-16">
      {/* Cinematic Backdrop Hero Banner */}
      {backdropUrl && (
        <div className="absolute top-0 left-0 right-0 h-96 sm:h-[480px] overflow-hidden -z-10 select-none">
          <img
            src={backdropUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-25 filter blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/70 to-surface-950/20" />
        </div>
      )}

      <Container className="pt-6 sm:pt-10">
        <div className="space-y-8">
          {/* Navigation Bar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 text-surface-300 hover:text-surface-50"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          {/* Hero Metadata Section */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster Card */}
            <div className="w-48 sm:w-64 md:w-72 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-surface-900 border border-surface-750/70 shadow-2xl">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-surface-600">
                  <Star className="h-12 w-12 stroke-1" />
                </div>
              )}
            </div>

            {/* Metadata Information */}
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
                  <span>{item.type}</span>
                  {item.collectionType && <span>• {item.collectionType}</span>}
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-surface-50 font-display">
                  {item.name}
                </h1>

                {item.originalTitle && item.originalTitle !== item.name && (
                  <p className="text-sm sm:text-base text-surface-400 font-medium italic">
                    Original Title: {item.originalTitle}
                  </p>
                )}

                {/* Badge Meta Strip */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-surface-300 pt-2">
                  {item.productionYear && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-surface-400" />
                      <span>{item.productionYear}</span>
                    </span>
                  )}

                  {formattedRuntime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-surface-400" />
                      <span>{formattedRuntime}</span>
                    </span>
                  )}

                  {item.communityRating !== undefined && item.communityRating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{item.communityRating.toFixed(1)}</span>
                    </span>
                  )}

                  {item.officialRating && (
                    <span className="flex items-center gap-1 rounded border border-surface-700 bg-surface-900 px-1.5 py-0.5 text-[11px] font-semibold text-surface-300">
                      <ShieldAlert className="h-3 w-3 text-surface-400" />
                      <span>{item.officialRating}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to={`/player/${item.id}`}>
                  <Button variant="primary" size="md" className="gap-2.5 px-6 shadow-lg shadow-brand-500/20">
                    <Play className="h-4 w-4 fill-current" />
                    <span>Play</span>
                  </Button>
                </Link>
              </div>

              {/* Overview / Synopsis */}
              {item.overview && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Overview
                  </h3>
                  <p className="text-sm sm:text-base text-surface-200 leading-relaxed max-w-3xl">
                    {item.overview}
                  </p>
                </div>
              )}

              {/* Genres Strip */}
              {item.genres && item.genres.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full bg-surface-900 border border-surface-750 px-3 py-1 text-xs font-medium text-surface-300"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cast & Crew / People */}
              {item.people && item.people.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Cast & Crew
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs text-surface-300">
                    {item.people.slice(0, 8).map((person) => (
                      <span
                        key={person.id || person.name}
                        className="rounded-md bg-surface-900/80 border border-surface-800 px-2.5 py-1"
                      >
                        <span className="font-medium text-surface-100">{person.name}</span>
                        {person.role && <span className="text-surface-400"> ({person.role})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
