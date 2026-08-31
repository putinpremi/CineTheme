import * as React from 'react';
import { usePlayerStore } from '../state/stores/usePlayerStore';
import type { ServiceWorkerUpdateEventDetail } from './registerServiceWorker';

export function usePwaUpdate() {
  const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const playerState = usePlayerStore((s) => s.playerState);

  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ServiceWorkerUpdateEventDetail>;
      if (customEvent.detail?.waitingWorker) {
        setWaitingWorker(customEvent.detail.waitingWorker);
        setIsDismissed(false);
      }
    };

    window.addEventListener('cinetheme-pwa-update', handleUpdate);

    return () => {
      window.removeEventListener('cinetheme-pwa-update', handleUpdate);
    };
  }, []);

  const hasUpdate = Boolean(waitingWorker) && !isDismissed && playerState !== 'PLAYING';

  const applyUpdate = React.useCallback(() => {
    if (!waitingWorker) return;

    // Never interrupt active playback
    if (usePlayerStore.getState().playerState === 'PLAYING') {
      return;
    }

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingWorker]);

  const dismissUpdate = React.useCallback(() => {
    setIsDismissed(true);
  }, []);

  return {
    hasUpdate,
    applyUpdate,
    dismissUpdate,
  };
}
