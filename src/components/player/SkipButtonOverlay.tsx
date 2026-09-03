import * as React from 'react';
import { FastForward } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import { usePlaybackPreferencesStore } from '../../state/stores/usePlaybackPreferencesStore';
import { introDetector } from '../../player/anime/introDetector';
import type { PlayerController } from '../../player/playerController';
import type { AnimeSegment } from '../../domain/anime/types';

export interface SkipButtonOverlayProps {
  controller: PlayerController | null;
  segments: AnimeSegment[];
}

export function SkipButtonOverlay({ controller, segments }: SkipButtonOverlayProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const itemId = usePlayerStore((s) => s.itemId);
  const autoSkipIntro = usePlaybackPreferencesStore((s) => s.autoSkipIntro);
  const autoSkipOutro = usePlaybackPreferencesStore((s) => s.autoSkipOutro);

  const [skippedSegments, setSkippedSegments] = React.useState<Set<string>>(new Set());

  // Reset skipped segment memory when switching items/episodes (BUG-009)
  React.useEffect(() => {
    setSkippedSegments(new Set());
  }, [itemId]);

  const activeSegment = React.useMemo(() => {
    return introDetector.getActiveSegment(currentTime, segments);
  }, [currentTime, segments]);

  const segmentKey = activeSegment ? `${itemId || 'media'}:${activeSegment.type}:${activeSegment.startTimeSeconds}` : null;
  const isAlreadySkipped = segmentKey ? skippedSegments.has(segmentKey) : false;

  const handleSkip = React.useCallback(() => {
    if (!controller || !activeSegment || !segmentKey) return;

    setSkippedSegments((prev) => new Set(prev).add(segmentKey));
    controller.seek(activeSegment.endTimeSeconds);
  }, [controller, activeSegment, segmentKey]);

  // Handle Automatic Skip if user enabled auto-skip preferences
  React.useEffect(() => {
    if (!activeSegment || !segmentKey || isAlreadySkipped) return;

    if (activeSegment.type === 'INTRO' && autoSkipIntro) {
      handleSkip();
    } else if (activeSegment.type === 'OUTRO' && autoSkipOutro) {
      handleSkip();
    }
  }, [activeSegment, segmentKey, isAlreadySkipped, autoSkipIntro, autoSkipOutro, handleSkip]);

  if (!activeSegment || isAlreadySkipped) return null;

  const getLabel = () => {
    switch (activeSegment.type) {
      case 'INTRO':
        return 'Skip Intro';
      case 'OUTRO':
        return 'Skip Outro';
      case 'RECAP':
        return 'Skip Recap';
      case 'PREVIEW':
        return 'Skip Preview';
      default:
        return 'Skip Segment';
    }
  };

  return (
    <div className="absolute bottom-24 right-4 sm:right-8 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <button
        type="button"
        onClick={handleSkip}
        className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-surface-900/90 hover:bg-brand-500 text-surface-100 hover:text-surface-950 font-semibold text-sm backdrop-blur-xl border border-surface-700/80 shadow-2xl transition-all duration-150 active:scale-95 focus-ring cursor-pointer select-none"
        aria-label={getLabel()}
      >
        <FastForward className="h-4 w-4 fill-current" />
        <span>{getLabel()}</span>
      </button>
    </div>
  );
}
