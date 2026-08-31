import * as React from 'react';
import { usePlayerStore } from '../state/stores/usePlayerStore';

export interface UsePlayerControlsOptions {
  hideTimeoutMs?: number;
  isMenuOpen?: boolean;
}

export function usePlayerControls({
  hideTimeoutMs = 3500,
  isMenuOpen = false,
}: UsePlayerControlsOptions = {}) {
  const [isVisible, setIsVisible] = React.useState(true);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPaused = usePlayerStore((s) => s.isPaused);
  const playerState = usePlayerStore((s) => s.playerState);

  const clearTimer = React.useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const resetTimer = React.useCallback(() => {
    clearTimer();
    setIsVisible(true);

    // Keep visible while paused, buffering, recovering, error, or if any menu is open
    if (!isPaused && playerState === 'PLAYING' && !isMenuOpen) {
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, hideTimeoutMs);
    }
  }, [clearTimer, hideTimeoutMs, isPaused, playerState, isMenuOpen]);

  const showControls = React.useCallback(() => {
    setIsVisible(true);
    resetTimer();
  }, [resetTimer]);

  const toggleControls = React.useCallback(() => {
    setIsVisible((prev) => !prev);
    resetTimer();
  }, [resetTimer]);

  React.useEffect(() => {
    resetTimer();
    return () => clearTimer();
  }, [resetTimer, clearTimer]);

  return {
    isVisible: isVisible || isPaused || isMenuOpen || playerState === 'BUFFERING' || playerState === 'RECOVERING' || playerState === 'ERROR',
    showControls,
    toggleControls,
    resetTimer,
  };
}
