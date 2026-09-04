import { Container } from '../components/layout/Container';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import {
  Sparkles,
  Compass,
  Film,
  Tv,
  Music,
  BookOpen,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaShelf } from '../components/media/MediaShelf';
import {
  useResumeItems,
  useNextUp,
  useSuggestions,
  useRecentlyAdded,
  useUserLibraries,
  useGenres,
} from '../hooks/useMediaQueries';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

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

export function HomeView() {

  const { data: resumeItems, isLoading: isResumeLoading } = useResumeItems(8);
  const { data: nextUpItems, isLoading: isNextUpLoading } = useNextUp(8);
  const { data: suggestions, isLoading: isSuggestionsLoading } = useSuggestions(8);
  const { data: latestItems, isLoading: isLatestLoading } = useRecentlyAdded(undefined, 14);
  const { data: libraries, isLoading: isLibrariesLoading } = useUserLibraries();
  const { data: genres } = useGenres();

  const hasContent =
    (resumeItems && resumeItems.length > 0) ||
    (nextUpItems && nextUpItems.length > 0) ||
    (suggestions && suggestions.length > 0) ||
    (latestItems && latestItems.length > 0) ||
    (libraries && libraries.length > 0);

  return (
    <div className="py-8 sm:py-10 space-y-10">
      <Container>
        {/* Cinematic Welcome Hero Banner */}
        <div className="rounded-2xl border border-surface-750/70 bg-gradient-to-br from-surface-850 via-surface-900 to-surface-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>CineTheme Web Client</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-surface-50 font-display">
              Cinematic Media Hub
            </h1>
            <p className="text-sm sm:text-base text-surface-300 leading-relaxed">
              Explore your server libraries, continue watching where you left off, and discover recently added movies and series.
            </p>
          </div>
        </div>
      </Container>

      {/* Continue Watching / Resume Section */}
      {resumeItems && resumeItems.length > 0 && (
        <Container>
          <MediaShelf
            title="Continue Watching"
            subtitle="Pick up where you left off"
            items={resumeItems}
            isLoading={isResumeLoading}
            aspectRatio="backdrop"
          />
        </Container>
      )}

      {/* Next Up (TV Episodes) */}
      {nextUpItems && nextUpItems.length > 0 && (
        <Container>
          <MediaShelf
            title="Next Up"
            subtitle="Next episodes queued for your ongoing series"
            items={nextUpItems}
            isLoading={isNextUpLoading}
            aspectRatio="backdrop"
          />
        </Container>
      )}

      {/* Recommended / Suggestions Rail */}
      {suggestions && suggestions.length > 0 && (
        <Container>
          <MediaShelf
            title="Recommended For You"
            subtitle="Personalized suggestions based on your watch history"
            items={suggestions}
            isLoading={isSuggestionsLoading}
            aspectRatio="poster"
          />
        </Container>
      )}

      {/* Libraries Quick Access Section */}
      <Container>
        <section className="space-y-4" aria-label="Media Libraries">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-surface-50 font-display">
              Media Libraries
            </h2>
            <Link
              to="/library"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              View All
            </Link>
          </div>

          {isLibrariesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : libraries && libraries.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {libraries.map((lib) => (
                <Link key={lib.id} to={`/library?id=${lib.id}`}>
                  <Card
                    variant="cinematic"
                    className="p-4 flex items-center gap-3.5 hover:border-brand-500/50 transition-all duration-200 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-800 border border-surface-700 group-hover:bg-brand-500/20 group-hover:border-brand-500/30 transition-colors">
                      {getLibraryIcon(lib.collectionType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-semibold truncate group-hover:text-brand-300 transition-colors">
                        {lib.name}
                      </CardTitle>
                      <CardDescription className="text-xs capitalize truncate">
                        {lib.collectionType || 'Library'}
                      </CardDescription>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </Container>

      {/* Genres Explorer Rail */}
      {genres && genres.length > 0 && (
        <Container>
          <section className="space-y-3" aria-label="Browse Genres">
            <h2 className="text-xl font-bold tracking-tight text-surface-50 font-display">
              Browse by Genre
            </h2>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {genres.slice(0, 16).map((genre) => (
                <Link
                  key={genre.id}
                  to={`/search?genre=${encodeURIComponent(genre.name)}`}
                  className="px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 hover:border-brand-500/50 hover:bg-surface-850 text-xs font-semibold text-surface-200 hover:text-surface-50 whitespace-nowrap transition-all select-none shrink-0"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </section>
        </Container>
      )}

      {/* General Recently Added Section */}
      <Container>
        <MediaShelf
          title="Recently Added"
          subtitle="Latest media ingested into your server"
          items={latestItems}
          isLoading={isLatestLoading}
          aspectRatio="poster"
        />
      </Container>

      {/* Empty State when server has no libraries or media */}
      {!isLibrariesLoading && !isLatestLoading && !hasContent && (
        <Container>
          <EmptyState
            icon={<Compass className="h-8 w-8 text-brand-400" />}
            title="No Media Found"
            description="Your Jellyfin server does not have any media items in its libraries yet."
          />
        </Container>
      )}
    </div>
  );
}
