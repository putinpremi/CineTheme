import { Subtitles, Check, Plus, Minus, RotateCcw } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import type { PlayerController } from '../../player/playerController';

export interface SubtitleTrackMenuProps {
  controller: PlayerController | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SubtitleTrackMenu({ controller, isOpen, onClose }: SubtitleTrackMenuProps) {
  const subtitleTracks = usePlayerStore((s) => s.subtitleTracks);
  const activeSubtitleIndex = usePlayerStore((s) => s.activeSubtitleIndex);
  const subtitleDelayMs = usePlayerStore((s) => s.subtitleDelayMs);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Subtitle Settings"
      className="absolute bottom-16 right-4 sm:right-28 z-40 w-72 sm:w-80 p-4 rounded-2xl bg-surface-950/95 backdrop-blur-xl border border-surface-800 shadow-2xl text-surface-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between border-b border-surface-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Subtitles className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-surface-50">Subtitles</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-surface-400 hover:text-surface-200"
          aria-label="Close subtitle settings"
        >
          Close
        </button>
      </div>

      {/* Subtitle Track List */}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
        {/* Off Option */}
        <button
          type="button"
          onClick={() => {
            controller?.setSubtitleTrack(null);
            onClose();
          }}
          className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
            activeSubtitleIndex === null
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-surface-300 hover:bg-surface-800/60 hover:text-surface-100'
          }`}
        >
          <span className="font-medium text-surface-100">Off</span>
          {activeSubtitleIndex === null && <Check className="h-4 w-4 text-brand-400 flex-shrink-0" />}
        </button>

        {subtitleTracks.map((track) => {
          const isSelected = activeSubtitleIndex === track.index;
          return (
            <button
              key={track.index}
              type="button"
              onClick={() => {
                controller?.setSubtitleTrack(track.index);
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
                  {track.deliveryMethod === 'Encode' && (
                    <span className="text-amber-400">Burn-in</span>
                  )}
                  {track.isDefault && <span className="text-brand-400">Default</span>}
                  {track.isForced && <span className="text-red-400">Forced</span>}
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-brand-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Subtitle Delay Offset */}
      <div className="border-t border-surface-800 pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-surface-300">
          <span>Subtitle Delay (Sync)</span>
          <span className="font-mono font-medium text-brand-300">
            {subtitleDelayMs > 0 ? `+${subtitleDelayMs}` : subtitleDelayMs} ms
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => controller?.setSubtitleDelay(subtitleDelayMs - 50)}
            aria-label="Decrease subtitle delay by 50 milliseconds"
            className="p-1.5 rounded-lg bg-surface-800 text-surface-200 hover:bg-surface-700 transition-colors flex-1 flex items-center justify-center gap-1 text-xs"
          >
            <Minus className="h-3.5 w-3.5" />
            <span>-50ms</span>
          </button>

          <button
            type="button"
            onClick={() => controller?.setSubtitleDelay(0)}
            aria-label="Reset subtitle delay"
            disabled={subtitleDelayMs === 0}
            className="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => controller?.setSubtitleDelay(subtitleDelayMs + 50)}
            aria-label="Increase subtitle delay by 50 milliseconds"
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
