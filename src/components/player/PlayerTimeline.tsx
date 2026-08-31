import * as React from 'react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import { formatPlaybackTime } from '../../utils/timeUtils';
import { trickplayService } from '../../api/services/trickplayService';
import type { PlayerController } from '../../player/playerController';
import type { TrickplayManifest, TrickplayTile } from '../../domain/anime/types';

export interface PlayerTimelineProps {
  controller: PlayerController | null;
  trickplayManifest?: TrickplayManifest | null;
  serverUrl?: string;
  itemId?: string;
  token?: string;
}

export function PlayerTimeline({
  controller,
  trickplayManifest,
  serverUrl,
  itemId,
  token,
}: PlayerTimelineProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const bufferedTime = usePlayerStore((s) => s.bufferedTime);

  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubTime, setScrubTime] = React.useState(0);
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = React.useState(0);

  const timelineRef = React.useRef<HTMLDivElement | null>(null);

  const displayTime = isScrubbing ? scrubTime : currentTime;
  const playedPercent = duration > 0 ? (displayTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  const calculateTimeFromEvent = React.useCallback(
    (clientX: number): { time: number; percent: number } => {
      if (!timelineRef.current || duration <= 0) return { time: 0, percent: 0 };
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = clickX / rect.width;
      const time = percent * duration;
      return { time, percent: percent * 100 };
    },
    [duration]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const { time } = calculateTimeFromEvent(e.clientX);
    setScrubTime(time);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { time, percent } = calculateTimeFromEvent(e.clientX);
    setHoverTime(time);
    setHoverPosition(percent);

    if (isScrubbing) {
      setScrubTime(time);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      const { time } = calculateTimeFromEvent(e.clientX);
      controller?.seek(time);
      setIsScrubbing(false);
    }
  };

  const handlePointerLeave = () => {
    if (!isScrubbing) {
      setHoverTime(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      controller?.seekRelative(-5);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      controller?.seekRelative(5);
    } else if (e.key === 'Home') {
      e.preventDefault();
      controller?.seek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      controller?.seek(duration);
    }
  };

  // Compute Trickplay thumbnail tile if manifest and coordinates are available
  const trickplayTile: TrickplayTile | null = React.useMemo(() => {
    if (
      !trickplayManifest ||
      !serverUrl ||
      !itemId ||
      !token ||
      hoverTime === null ||
      duration <= 0
    ) {
      return null;
    }

    return trickplayService.getTileForTime(
      serverUrl,
      itemId,
      trickplayManifest.width,
      token,
      trickplayManifest,
      hoverTime
    );
  }, [trickplayManifest, serverUrl, itemId, token, hoverTime, duration]);

  return (
    <div className="w-full select-none flex flex-col gap-1.5 group">
      {/* Timeline track container */}
      <div
        ref={timelineRef}
        role="slider"
        tabIndex={0}
        aria-label="Video Timeline"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Math.round(displayTime)}
        aria-valuetext={`${formatPlaybackTime(displayTime)} of ${formatPlaybackTime(duration)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        className="relative w-full h-4 flex items-center cursor-pointer touch-none focus-visible:outline-none"
      >
        {/* Track background */}
        <div className="relative w-full h-1.5 group-hover:h-2 bg-surface-800/80 rounded-full overflow-hidden transition-all duration-150 backdrop-blur-sm">
          {/* Buffered range */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-surface-600/70 rounded-full transition-[width] duration-200"
            style={{ width: `${Math.min(100, Math.max(0, bufferedPercent))}%` }}
          />

          {/* Played range */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-brand-500 rounded-full transition-[width] duration-75"
            style={{ width: `${Math.min(100, Math.max(0, playedPercent))}%` }}
          />
        </div>

        {/* Scrubber thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 bg-brand-400 rounded-full shadow-lg scale-0 group-hover:scale-100 group-focus-visible:scale-100 transition-transform duration-150 pointer-events-none ring-2 ring-brand-300/40"
          style={{ left: `${Math.min(100, Math.max(0, playedPercent))}%` }}
        />

        {/* Hover Timecode / Trickplay Tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-10 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${Math.min(92, Math.max(8, hoverPosition))}%`,
              bottom: trickplayTile ? '1.75rem' : 'auto',
            }}
          >
            {trickplayTile ? (
              /* Trickplay Visual Thumbnail Box */
              <div className="flex flex-col items-center p-1 rounded-xl bg-surface-950/95 border border-surface-700 shadow-2xl backdrop-blur-md mb-1.5">
                <div
                  className="rounded-lg overflow-hidden bg-black"
                  style={{
                    width: '160px',
                    height: '90px',
                    backgroundImage: `url("${trickplayTile.imageUrl}")`,
                    backgroundPosition: `-${trickplayTile.x}px -${trickplayTile.y}px`,
                    backgroundSize: `${trickplayManifest?.width}px ${trickplayManifest?.height}px`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <span className="text-[11px] font-mono font-medium text-surface-200 pt-1">
                  {formatPlaybackTime(hoverTime)}
                </span>
              </div>
            ) : (
              /* Standard Timecode Tooltip Fallback */
              <div className="px-2 py-0.5 rounded-md bg-surface-900/90 backdrop-blur-md border border-surface-700 text-[11px] font-mono text-surface-200 shadow-xl">
                {formatPlaybackTime(hoverTime)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Time indicators */}
      <div className="flex items-center justify-between text-xs font-mono text-surface-300">
        <span>{formatPlaybackTime(displayTime)}</span>
        <span>{formatPlaybackTime(duration)}</span>
      </div>
    </div>
  );
}
