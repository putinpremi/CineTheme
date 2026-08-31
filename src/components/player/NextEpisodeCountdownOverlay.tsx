import * as React from 'react';
import { Play, X } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import { usePlaybackPreferencesStore } from '../../state/stores/usePlaybackPreferencesStore';

export interface NextEpisodeCountdownOverlayProps {
  nextEpisodeId?: string;
  nextEpisodeTitle?: string;
  nextEpisodeNumber?: number;
  seriesName?: string;
  onPlayNext: () => void;
}

export function NextEpisodeCountdownOverlay({
  nextEpisodeId,
  nextEpisodeTitle,
  nextEpisodeNumber,
  seriesName,
  onPlayNext,
}: NextEpisodeCountdownOverlayProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const playerState = usePlayerStore((s) => s.playerState);
  const autoPlayNextEpisode = usePlaybackPreferencesStore((s) => s.autoPlayNextEpisode);

  const [isDismissed, setIsDismissed] = React.useState(false);
  const [countdown, setCountdown] = React.useState(10);
  const hasAutoTriggeredRef = React.useRef(false);

  const remainingSeconds = duration > 0 ? duration - currentTime : 999;
  const isNearEnd =
    Boolean(nextEpisodeId) &&
    !isDismissed &&
    (playerState === 'ENDED' || (duration > 60 && remainingSeconds <= 25 && remainingSeconds >= 0));

  React.useEffect(() => {
    if (!isNearEnd) {
      setCountdown(10);
      hasAutoTriggeredRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (autoPlayNextEpisode && !hasAutoTriggeredRef.current) {
            hasAutoTriggeredRef.current = true;
            onPlayNext();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isNearEnd, autoPlayNextEpisode, onPlayNext]);

  if (!isNearEnd) return null;

  return (
    <div
      role="dialog"
      aria-label="Next Episode Countdown"
      className="absolute bottom-24 left-4 sm:left-8 z-40 max-w-sm p-4 rounded-2xl bg-surface-950/95 backdrop-blur-xl border border-surface-800 shadow-2xl text-surface-100 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold tracking-wide uppercase text-brand-400">
            Next Episode in {countdown}s
          </span>
          <h4 className="text-sm font-bold text-surface-50 truncate mt-0.5">
            {nextEpisodeNumber ? `Episode ${nextEpisodeNumber}: ` : ''}
            {nextEpisodeTitle || 'Next Episode'}
          </h4>
          {seriesName && <span className="text-xs text-surface-400 truncate">{seriesName}</span>}
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors focus-ring"
          aria-label="Cancel next episode countdown"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            if (!hasAutoTriggeredRef.current) {
              hasAutoTriggeredRef.current = true;
              onPlayNext();
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs shadow-lg transition-transform active:scale-95 focus-ring cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Play Now</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="py-2 px-3 rounded-xl bg-surface-850 hover:bg-surface-800 text-surface-300 hover:text-surface-100 text-xs font-medium border border-surface-750 transition-colors focus-ring cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
