import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../pwa/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/90 text-surface-950 font-semibold text-xs shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>You are currently offline. Showing cached application shell.</span>
    </div>
  );
}
