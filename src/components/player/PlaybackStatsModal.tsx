import { Info, X, ShieldCheck } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import type { PlayerController } from '../../player/playerController';

export interface PlaybackStatsModalProps {
  controller: PlayerController | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaybackStatsModal({ controller, isOpen, onClose }: PlaybackStatsModalProps) {
  const playbackMode = usePlayerStore((s) => s.playbackMode);
  const playerState = usePlayerStore((s) => s.playerState);
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const subtitleTracks = usePlayerStore((s) => s.subtitleTracks);
  const activeAudioIndex = usePlayerStore((s) => s.activeAudioIndex);
  const activeSubtitleIndex = usePlayerStore((s) => s.activeSubtitleIndex);
  const selectedQuality = usePlayerStore((s) => s.selectedQuality);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const audioDelayMs = usePlayerStore((s) => s.audioDelayMs);
  const subtitleDelayMs = usePlayerStore((s) => s.subtitleDelayMs);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const bufferedTime = usePlayerStore((s) => s.bufferedTime);
  const playSessionId = usePlayerStore((s) => s.playSessionId);
  const mediaSourceId = usePlayerStore((s) => s.mediaSourceId);

  const videoEl = typeof controller?.getVideoElement === 'function' ? controller.getVideoElement() : null;
  const source = typeof controller?.getCurrentSource === 'function' ? controller.getCurrentSource() : null;
  const currentAudio = audioTracks.find((a) => a.index === activeAudioIndex);
  const currentSub = subtitleTracks.find((s) => s.index === activeSubtitleIndex);

  if (!isOpen) return null;

  const resolutionStr =
    videoEl && videoEl.videoWidth > 0
      ? `${videoEl.videoWidth} × ${videoEl.videoHeight}`
      : 'Auto / Pending';

  const bufferAhead = Math.max(0, bufferedTime - currentTime).toFixed(1);

  return (
    <div
      role="dialog"
      aria-label="Playback Diagnostics"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-surface-950/95 border border-surface-800 rounded-2xl shadow-2xl p-5 text-surface-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-800 pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-brand-400" />
            <h2 className="text-base font-semibold text-surface-50">Stream Diagnostics & Media Info</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close diagnostics"
            className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1">
            <span className="text-surface-400">Playback Mode</span>
            <span className="font-mono font-bold text-brand-300">{playbackMode || 'None'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1">
            <span className="text-surface-400">Play Method</span>
            <span className="font-mono text-surface-200">{source?.playMethod || 'Negotiating'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1">
            <span className="text-surface-400">Player State</span>
            <span className="font-mono font-bold text-surface-100">{playerState}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1">
            <span className="text-surface-400">Video Resolution</span>
            <span className="font-mono text-surface-100 font-semibold">{resolutionStr}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1">
            <span className="text-surface-400">Buffer Health</span>
            <span className="font-mono text-emerald-400 font-semibold">+{bufferAhead}s forward</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1">
            <span className="text-surface-400">Container</span>
            <span className="font-mono uppercase text-surface-200">{source?.container || 'Unknown'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1">
            <span className="text-surface-400">Playback Speed</span>
            <span className="font-mono text-surface-200">{playbackRate}x</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1">
            <span className="text-surface-400">Audio Sync Offset</span>
            <span className="font-mono text-surface-200">
              {audioDelayMs > 0 ? `+${audioDelayMs}` : audioDelayMs} ms
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1 col-span-2">
            <span className="text-surface-400">Subtitle Sync Offset</span>
            <span className="font-mono text-surface-200">
              {subtitleDelayMs > 0 ? `+${subtitleDelayMs}` : subtitleDelayMs} ms
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1 col-span-2">
            <span className="text-surface-400">Active Audio Track</span>
            <span className="font-mono text-surface-200">
              {currentAudio ? `${currentAudio.displayTitle} (${currentAudio.codec.toUpperCase()})` : 'Default'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1 col-span-2">
            <span className="text-surface-400">Active Subtitle Track</span>
            <span className="font-mono text-surface-200">
              {currentSub ? `${currentSub.displayTitle} (${currentSub.codec.toUpperCase()})` : 'Off'}
            </span>
          </div>

          {selectedQuality && (
            <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1 col-span-2">
              <span className="text-surface-400">Quality Constraint</span>
              <span className="font-mono text-brand-300">
                {selectedQuality.label} ({((selectedQuality.maxBitrate || 0) / 1_000_000).toFixed(1)} Mbps cap)
              </span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1 col-span-2">
            <span className="text-surface-400">Session ID</span>
            <span className="font-mono text-[11px] text-surface-300 truncate">{playSessionId || 'N/A'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-900/80 border border-surface-800 flex flex-col gap-1 col-span-2">
            <span className="text-surface-400">Media Source ID</span>
            <span className="font-mono text-[11px] text-surface-300 truncate">{mediaSourceId || 'N/A'}</span>
          </div>
        </div>

        {/* Security Redaction Note */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-300">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          <span>Security Notice: All stream credentials, access tokens, and passwords are permanently redacted.</span>
        </div>
      </div>
    </div>
  );
}
