import { AlertCircle, RotateCcw, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { usePlayerStore } from '../../state/stores/usePlayerStore';

export interface ErrorOverlayProps {
  onRetry: () => void;
  onExit: () => void;
  onLogin?: () => void;
}

export function ErrorOverlay({ onRetry, onExit, onLogin }: ErrorOverlayProps) {
  const error = usePlayerStore((s) => s.error);
  const playerState = usePlayerStore((s) => s.playerState);

  if (playerState !== 'ERROR' || !error) {
    return null;
  }

  const isAuthError =
    error.code === 'AUTH_UNAUTHORIZED' || error.message.toLowerCase().includes('expired');

  const getFriendlyMessage = () => {
    if (isAuthError) {
      return 'Your Jellyfin session has expired. Please log in again to continue playback.';
    }
    if (error.code === 'NO_USABLE_STREAM' || error.code === 'MEDIA_SOURCE_UNAVAILABLE') {
      return 'Your browser cannot directly play this media format and no compatible transcode stream is available.';
    }
    if (error.code === 'HLS_STREAM_ERROR') {
      return 'Network stream disconnected or transcoding failed on the server.';
    }
    return error.message || 'An unexpected playback error occurred.';
  };

  return (
    <div
      role="alert"
      aria-label="Playback Error"
      className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-surface-950/95 border border-red-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-surface-50">Playback Failed</h2>
          <p className="text-xs text-surface-300 mt-1.5 leading-relaxed">{getFriendlyMessage()}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-2">
          {isAuthError ? (
            <Button
              variant="primary"
              size="md"
              onClick={onLogin || onExit}
              className="w-full gap-2 justify-center"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={onRetry}
                className="w-full sm:flex-1 gap-2 justify-center"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retry Playback</span>
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={onExit}
                className="w-full sm:flex-1 gap-2 justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Exit Player</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
