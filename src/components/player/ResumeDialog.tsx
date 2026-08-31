import { Play, RotateCcw } from 'lucide-react';
import { formatPlaybackTime } from '../../utils/timeUtils';
import { Button } from '../ui/Button';

export interface ResumeDialogProps {
  resumePositionSeconds: number;
  isOpen: boolean;
  onResume: () => void;
  onStartOver: () => void;
}

export function ResumeDialog({
  resumePositionSeconds,
  isOpen,
  onResume,
  onStartOver,
}: ResumeDialogProps) {
  if (!isOpen || resumePositionSeconds <= 0) return null;

  return (
    <div
      role="dialog"
      aria-label="Resume Playback"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-surface-950/95 border border-surface-800 rounded-2xl shadow-2xl p-6 text-surface-100 flex flex-col items-center text-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
          <Play className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-surface-50">Resume Playback?</h2>
          <p className="text-xs text-surface-400 mt-1">
            You previously stopped watching at{' '}
            <span className="font-mono font-semibold text-brand-300">
              {formatPlaybackTime(resumePositionSeconds)}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full mt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onResume}
            className="w-full gap-2 justify-center"
            autoFocus
          >
            <Play className="h-4 w-4" />
            <span>Resume from {formatPlaybackTime(resumePositionSeconds)}</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onStartOver}
            className="w-full gap-2 justify-center"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Start from Beginning</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
