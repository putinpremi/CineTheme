import { Loader2, RefreshCw } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';

export function BufferingOverlay() {
  const playerState = usePlayerStore((s) => s.playerState);
  const recoveryAttempt = usePlayerStore((s) => s.recoveryAttempt);

  if (playerState !== 'BUFFERING' && playerState !== 'NEGOTIATING' && playerState !== 'RECOVERING') {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity duration-200">
      <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface-950/80 border border-surface-800/80 shadow-2xl backdrop-blur-md">
        {playerState === 'RECOVERING' ? (
          <>
            <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-xs font-semibold text-surface-100">Reconnecting Stream</span>
              <span className="text-[10px] text-surface-400 font-mono">
                Recovery attempt {recoveryAttempt} of 3
              </span>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
            <span className="text-xs font-medium text-surface-300">
              {playerState === 'NEGOTIATING' ? 'Negotiating Stream...' : 'Buffering...'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
