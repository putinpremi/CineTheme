import type { MediaItem } from '../../domain/media/types';
import { MediaCard } from './MediaCard';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../utils/cn';

export interface MediaShelfProps {
  title: string;
  subtitle?: string;
  items?: MediaItem[];
  isLoading?: boolean;
  aspectRatio?: 'poster' | 'backdrop' | 'square';
  emptyMessage?: string;
  className?: string;
}

export function MediaShelf({
  title,
  subtitle,
  items = [],
  isLoading = false,
  aspectRatio = 'poster',
  emptyMessage = 'No items found.',
  className,
}: MediaShelfProps) {
  if (!isLoading && items.length === 0) {
    return null; // Return null so empty shelves don't clutter the home screen
  }

  const gridColsClass =
    aspectRatio === 'backdrop'
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7';

  return (
    <section className={cn('space-y-4', className)} aria-label={title}>
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-surface-50 font-display">{title}</h2>
          {subtitle && <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className={cn('grid gap-4', gridColsClass)}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <Skeleton
                  className={cn(
                    'w-full rounded-xl',
                    aspectRatio === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'
                  )}
                />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))
          : items.map((item) => (
              <MediaCard key={item.id} item={item} aspectRatio={aspectRatio} />
            ))}
      </div>
      {!isLoading && items.length === 0 && (
        <p className="text-xs text-surface-500 italic py-2">{emptyMessage}</p>
      )}
    </section>
  );
}
