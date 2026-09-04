import { Gauge, Check } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import type { PlayerController } from '../../player/playerController';

export interface PlaybackSpeedMenuProps {
  controller: PlayerController | null;
  isOpen: boolean;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export function PlaybackSpeedMenu({ controller, isOpen, onClose }: PlaybackSpeedMenuProps) {
  const playbackRate = usePlayerStore((s) => s.playbackRate);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Playback Speed"
      className="absolute bottom-16 right-4 sm:right-52 z-40 w-56 p-3 rounded-2xl bg-surface-950/95 backdrop-blur-xl border border-surface-800 shadow-2xl text-surface-100 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between border-b border-surface-800 pb-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-surface-50">Playback Speed</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-surface-400 hover:text-surface-200"
          aria-label="Close speed menu"
        >
          Close
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
        {SPEED_OPTIONS.map((speed) => {
          const isSelected = Math.abs(playbackRate - speed) < 0.01;
          return (
            <button
              key={speed}
              type="button"
              onClick={() => {
                controller?.setPlaybackSpeed(speed);
                onClose();
              }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                isSelected
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 font-semibold'
                  : 'text-surface-300 hover:bg-surface-800/60 hover:text-surface-100'
              }`}
            >
              <span>{speed === 1.0 ? '1.0x (Normal)' : `${speed}x`}</span>
              {isSelected && <Check className="h-4 w-4 text-brand-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
