import { Sparkles, RefreshCw, X } from 'lucide-react';
import { usePwaUpdate } from '../../pwa/usePwaUpdate';

export function PwaUpdateToast() {
  const { hasUpdate, applyUpdate, dismissUpdate } = usePwaUpdate();

  if (!hasUpdate) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-label="Application Update Available"
      className="fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-2xl bg-surface-900/95 backdrop-blur-xl border border-brand-500/40 shadow-2xl text-surface-100 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-400 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-surface-50">New Version Available</h4>
            <p className="text-xs text-surface-400 mt-0.5">
              An update to CineTheme has been downloaded and is ready to install.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissUpdate}
          className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors focus-ring"
          aria-label="Dismiss update notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={applyUpdate}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs shadow-lg transition-transform active:scale-95 focus-ring cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Update Now</span>
        </button>

        <button
          type="button"
          onClick={dismissUpdate}
          className="py-2 px-3 rounded-xl bg-surface-850 hover:bg-surface-800 text-surface-300 hover:text-surface-100 text-xs font-medium border border-surface-750 transition-colors focus-ring cursor-pointer"
        >
          Later
        </button>
      </div>
    </div>
  );
}
