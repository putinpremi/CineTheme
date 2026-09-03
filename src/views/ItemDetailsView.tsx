import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';
import { Play, RotateCcw, ArrowLeft, Star, Clock, Calendar, ShieldAlert } from 'lucide-react';
import { useItemDetails, useEpisodes } from '../hooks/useMediaQueries';
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

  const isSeries = item?.type === 'Series' || item?.type === 'Season';
  const { data: episodes } = useEpisodes(
    isSeries && item ? item.id : '',
    item?.type === 'Season' ? item.id : undefined
  );

  const firstPlayableEpisode = React.useMemo(() => {
    if (!episodes || episodes.length === 0) return null;
    return (
      episodes.find(
        (ep) => !ep.isPlayed && (ep.playbackPositionSeconds || 0) < (ep.runTimeSeconds || 60) * 0.9
      ) || episodes[0]
    );
  }, [episodes]);

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

  const hasResumeProgress = (item.playbackPositionSeconds || 0) > 10;
  const progressPercent =
    item.runTimeTicks && item.runTimeTicks > 0 && item.playbackPositionTicks
      ? Math.min(100, Math.round((item.playbackPositionTicks / item.runTimeTicks) * 100))
      : 0;

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
            <div className="w-48 sm:w-64 md:w-72 shrink-0 flex flex-col gap-2.5">
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-surface-900 border border-surface-750/70 shadow-2xl relative">
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
              {progressPercent > 0 && (
                <div className="space-y-1.5 px-0.5">
                  <div className="h-1.5 w-full bg-surface-850 rounded-full overflow-hidden border border-surface-750/50">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-surface-400 font-mono">
                    <span>Watched</span>
                    <span>{progressPercent}%</span>
                  </div>
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
                {isSeries ? (
                  firstPlayableEpisode ? (
                    <Link
                      to={`/player/${firstPlayableEpisode.id}${
                        (firstPlayableEpisode.playbackPositionSeconds || 0) > 10
                          ? `?start=${firstPlayableEpisode.playbackPositionSeconds}`
                          : ''
                      }`}
                    >
                      <Button variant="primary" size="md" className="gap-2.5 px-6 shadow-lg shadow-brand-500/20">
                        <Play className="h-4 w-4 fill-current" />
                        <span>
                          {(firstPlayableEpisode.playbackPositionSeconds || 0) > 10 ? 'Resume' : 'Play'}{' '}
                          {firstPlayableEpisode.indexNumber
                            ? `S${firstPlayableEpisode.parentIndexNumber || 1}:E${firstPlayableEpisode.indexNumber}`
                            : 'Next Episode'}
                        </span>
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="primary" size="md" disabled className="gap-2.5 px-6">
                      <Play className="h-4 w-4 fill-current" />
                      <span>No Episodes Found</span>
                    </Button>
                  )
                ) : hasResumeProgress ? (
                  <>
                    <Link to={`/player/${item.id}?start=${item.playbackPositionSeconds}`}>
                      <Button variant="primary" size="md" className="gap-2.5 px-6 shadow-lg shadow-brand-500/20">
                        <Play className="h-4 w-4 fill-current" />
                        <span>Resume Playback (from {formatRuntime(item.playbackPositionSeconds)})</span>
                      </Button>
                    </Link>
                    <Link to={`/player/${item.id}?start=0`}>
                      <Button variant="secondary" size="md" className="gap-2 px-4">
                        <RotateCcw className="h-4 w-4" />
                        <span>Start Over</span>
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link to={`/player/${item.id}`}>
                    <Button variant="primary" size="md" className="gap-2.5 px-6 shadow-lg shadow-brand-500/20">
                      <Play className="h-4 w-4 fill-current" />
                      <span>Play</span>
                    </Button>
                  </Link>
                )}
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

              {/* Episodes List for Series/Season */}
              {isSeries && episodes && episodes.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-surface-800/80">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-surface-50 font-display">Episodes</h3>
                    <span className="text-xs text-surface-400 font-mono">{episodes.length} episodes</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {episodes.map((ep) => {
                      const epPoster = ep.primaryImageTag
                        ? buildItemImageUrl(serverUrl, ep.id, 'Primary', { tag: ep.primaryImageTag, maxWidth: 360 })
                        : '';
                      const epProgress =
                        ep.runTimeTicks && ep.runTimeTicks > 0 && ep.playbackPositionTicks
                          ? Math.min(100, Math.round((ep.playbackPositionTicks / ep.runTimeTicks) * 100))
                          : 0;

                      return (
                        <Link
                          key={ep.id}
                          to={`/player/${ep.id}${
                            (ep.playbackPositionSeconds || 0) > 10 ? `?start=${ep.playbackPositionSeconds}` : ''
                          }`}
                          className="group flex flex-col rounded-xl overflow-hidden bg-surface-900/90 border border-surface-800 hover:border-brand-500/50 transition-all p-3 gap-2.5"
                        >
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-surface-850">
                            {epPoster ? (
                              <img
                                src={epPoster}
                                alt={ep.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex w-full h-full items-center justify-center text-surface-600">
                                <Play className="h-6 w-6" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="h-10 w-10 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg">
                                <Play className="h-4 w-4 fill-current ml-0.5" />
                              </div>
                            </div>
                            {epProgress > 0 && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-950/80">
                                <div className="h-full bg-brand-500" style={{ width: `${epProgress}%` }} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs text-brand-400 font-semibold mb-0.5">
                              <span>E{ep.indexNumber || 1}</span>
                              {ep.runTimeSeconds ? (
                                <span className="text-surface-400 font-normal">{Math.round(ep.runTimeSeconds / 60)}m</span>
                              ) : null}
                            </div>
                            <h4 className="text-sm font-semibold text-surface-100 truncate group-hover:text-brand-300 transition-colors">
                              {ep.name}
                            </h4>
                            {ep.overview && (
                              <p className="text-xs text-surface-400 line-clamp-2 mt-1 leading-relaxed">
                                {ep.overview}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
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
