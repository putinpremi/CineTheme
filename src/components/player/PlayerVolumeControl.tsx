import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import type { PlayerController } from '../../player/playerController';

export interface PlayerVolumeControlProps {
  controller: PlayerController | null;
}

export function PlayerVolumeControl({ controller }: PlayerVolumeControlProps) {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);

  const effectiveVolume = isMuted ? 0 : volume;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    controller?.setVolume(next);
    if (isMuted && next > 0) {
      controller?.setMuted(false);
    }
  };

  const toggleMute = () => {
    controller?.toggleMute();
  };

  return (
    <div className="flex items-center gap-2 group/vol">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted || effectiveVolume === 0 ? 'Unmute' : 'Mute'}
        className="p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
      >
        {isMuted || effectiveVolume === 0 ? (
          <VolumeX className="h-5 w-5 text-red-400" />
        ) : effectiveVolume < 0.5 ? (
          <Volume1 className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>

      <div className="w-0 overflow-hidden group-hover/vol:w-20 sm:w-20 group-focus-within/vol:w-20 transition-all duration-200 flex items-center">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={effectiveVolume}
          onChange={handleVolumeChange}
          aria-label="Volume Slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(effectiveVolume * 100)}
          aria-valuetext={`${Math.round(effectiveVolume * 100)} percent`}
          className="w-full h-1.5 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-500 focus-ring"
        />
      </div>
    </div>
  );
}
