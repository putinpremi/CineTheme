import { Music, Check, Plus, Minus, RotateCcw } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import type { PlayerController } from '../../player/playerController';

export interface AudioTrackMenuProps {
  controller: PlayerController | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AudioTrackMenu({ controller, isOpen, onClose }: AudioTrackMenuProps) {
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const activeAudioIndex = usePlayerStore((s) => s.activeAudioIndex);
  const audioDelayMs = usePlayerStore((s) => s.audioDelayMs);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Audio Settings"
      className="absolute bottom-16 right-4 sm:right-16 z-40 w-72 sm:w-80 p-4 rounded-2xl bg-surface-950/95 backdrop-blur-xl border border-surface-800 shadow-2xl text-surface-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between border-b border-surface-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-surface-50">Audio Track</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-surface-400 hover:text-surface-200"
          aria-label="Close audio settings"
        >
          Close
        </button>
      </div>

      {/* Track List */}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
        {audioTracks.length === 0 ? (
          <p className="text-xs text-surface-400 py-2">No audio tracks detected.</p>
        ) : (
          audioTracks.map((track) => {
            const isSelected = activeAudioIndex === track.index;
            return (
              <button
                key={track.index}
                type="button"
                onClick={() => {
                  controller?.setAudioTrack(track.index);
                  onClose();
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-surface-300 hover:bg-surface-800/60 hover:text-surface-100'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-surface-100">{track.displayTitle}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-surface-400 font-mono">
                    <span className="uppercase">{track.codec}</span>
                    {track.channels && <span>• {track.channels}ch</span>}
                    {track.isDefault && <span className="text-brand-400">Default</span>}
                  </div>
                </div>
                {isSelected && <Check className="h-4 w-4 text-brand-400 flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>

      {/* Audio Delay Offset */}
      <div className="border-t border-surface-800 pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-surface-300">
          <span>Audio Delay (Sync)</span>
          <span className="font-mono font-medium text-brand-300">
            {audioDelayMs > 0 ? `+${audioDelayMs}` : audioDelayMs} ms
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => controller?.setAudioDelay(audioDelayMs - 50)}
            aria-label="Decrease audio delay by 50 milliseconds"
            className="p-1.5 rounded-lg bg-surface-800 text-surface-200 hover:bg-surface-700 transition-colors flex-1 flex items-center justify-center gap-1 text-xs"
          >
            <Minus className="h-3.5 w-3.5" />
            <span>-50ms</span>
          </button>

          <button
            type="button"
            onClick={() => controller?.setAudioDelay(0)}
            aria-label="Reset audio delay"
            disabled={audioDelayMs === 0}
            className="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => controller?.setAudioDelay(audioDelayMs + 50)}
            aria-label="Increase audio delay by 50 milliseconds"
            className="p-1.5 rounded-lg bg-surface-800 text-surface-200 hover:bg-surface-700 transition-colors flex-1 flex items-center justify-center gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+50ms</span>
          </button>
        </div>
      </div>
    </div>
  );
}
