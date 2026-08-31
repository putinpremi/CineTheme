import { useUIStore, type ToastItem } from '../../state/stores/useUIStore';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const icons = {
    default: <Info className="h-5 w-5 text-brand-400 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
  };

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border border-surface-700 bg-surface-850 p-4 shadow-xl text-surface-50 animate-in fade-in-0 slide-in-from-bottom-5',
        toast.type === 'error' && 'border-rose-500/50 bg-rose-950/60',
        toast.type === 'success' && 'border-emerald-500/50 bg-emerald-950/60',
        toast.type === 'warning' && 'border-amber-500/50 bg-amber-950/60'
      )}
    >
      {icons[toast.type ?? 'default']}
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-semibold leading-tight">{toast.title}</p>
        {toast.description && <p className="text-xs text-surface-300 leading-relaxed">{toast.description}</p>}
      </div>
      <button
        onClick={onClose}
        className="rounded-sm p-0.5 text-surface-400 hover:text-surface-50 focus-ring cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
