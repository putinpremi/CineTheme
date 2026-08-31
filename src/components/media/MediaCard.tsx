import * as React from 'react';
import { Link } from 'react-router-dom';
import type { MediaItem } from '../../domain/media/types';
import { buildItemImageUrl } from '../../api/client/imageUtils';
import { useAuthStore } from '../../state/stores/useAuthStore';
import { Film, Play, Star } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface MediaCardProps {
  item: MediaItem;
  aspectRatio?: 'poster' | 'backdrop' | 'square';
  className?: string;
}

export function MediaCard({ item, aspectRatio = 'poster', className }: MediaCardProps) {
  const session = useAuthStore((s) => s.session);
  const serverUrl = session?.serverUrl || '';

  const imageType = aspectRatio === 'backdrop' ? 'Backdrop' : 'Primary';
  const tag =
    aspectRatio === 'backdrop'
      ? item.backdropImageTags[0] || item.primaryImageTag
      : item.primaryImageTag;

  const imageUrl = tag
    ? buildItemImageUrl(serverUrl, item.id, imageType, { tag, quality: 85, maxWidth: 400 })
    : '';

  const [imageError, setImageError] = React.useState(false);

  const progressPercent =
    item.runTimeTicks && item.runTimeTicks > 0 && item.playbackPositionTicks
      ? Math.min(100, Math.round((item.playbackPositionTicks / item.runTimeTicks) * 100))
      : 0;

  const aspectClass =
    aspectRatio === 'backdrop'
      ? 'aspect-video'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : 'aspect-[2/3]';

  return (
    <Link
      to={`/item/${item.id}`}
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden bg-surface-900 border border-surface-800/80 transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10 focus-ring select-none',
        className
      )}
      aria-label={item.name}
    >
      <div className={cn('relative w-full overflow-hidden bg-surface-850', aspectClass)}>
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-850 text-surface-600">
            <Film className="h-10 w-10 stroke-1" />
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transform transition-transform duration-300 group-hover:scale-110">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Resume progress bar */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-surface-950/80">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}

        {/* Rating badge */}
        {item.communityRating !== undefined && item.communityRating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-surface-950/80 px-2 py-0.5 text-xs font-semibold text-amber-400 backdrop-blur-md border border-surface-700/60">
            <Star className="h-3 w-3 fill-current" />
            <span>{item.communityRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col p-3 space-y-1">
        <h4 className="text-sm font-semibold text-surface-50 truncate group-hover:text-brand-300 transition-colors">
          {item.name}
        </h4>
        <div className="flex items-center justify-between text-xs text-surface-400">
          <span>{item.productionYear || item.type}</span>
          {item.runTimeSeconds ? <span>{Math.round(item.runTimeSeconds / 60)} min</span> : null}
        </div>
      </div>
    </Link>
  );
}
