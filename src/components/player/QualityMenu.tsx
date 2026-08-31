import { Sliders, Check, ShieldCheck } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import type { PlayerController } from '../../player/playerController';
import { QUALITY_PRESETS } from '../../domain/player/types';

export interface QualityMenuProps {
  controller: PlayerController | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QualityMenu({ controller, isOpen, onClose }: QualityMenuProps) {
  const selectedQuality = usePlayerStore((s) => s.selectedQuality);
  const playbackMode = usePlayerStore((s) => s.playbackMode);

  if (!isOpen) return null;

  const currentSource = controller?.getCurrentSource();

  return (
    <div
      role="dialog"
      aria-label="Quality Settings"
      className="absolute bottom-16 right-4 sm:right-40 z-40 w-72 p-4 rounded-2xl bg-surface-950/95 backdrop-blur-xl border border-surface-800 shadow-2xl text-surface-100 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between border-b border-surface-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-surface-50">Stream Quality</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-surface-400 hover:text-surface-200"
          aria-label="Close quality settings"
        >
          Close
        </button>
      </div>

      {/* Active Playback Mode Indicator */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-900/80 border border-surface-800 text-[11px] text-surface-300">
        <span>Delivery Mode</span>
        <span className="font-mono font-medium text-brand-300">
          {currentSource?.playMethod || playbackMode || 'Direct Play'}
        </span>
      </div>

      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
        {QUALITY_PRESETS.map((preset) => {
          const isSelected =
            (!selectedQuality && preset.id === 'auto') ||
            (selectedQuality && selectedQuality.id === preset.id);

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                controller?.setQuality(preset.id === 'auto' ? null : preset);
                onClose();
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                isSelected
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-surface-300 hover:bg-surface-800/60 hover:text-surface-100'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium text-surface-100">{preset.label}</span>
                {preset.maxBitrate && (
                  <span className="text-[10px] text-surface-400 font-mono">
                    Limits bandwidth to {(preset.maxBitrate / 1_000_000).toFixed(1)} Mbps
                  </span>
                )}
              </div>
              {isSelected && <Check className="h-4 w-4 text-brand-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-surface-400 pt-1 border-t border-surface-800">
        <ShieldCheck className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
        <span>Jellyfin server negotiates stream transcoding based on selected bitrate cap.</span>
      </div>
    </div>
  );
}
