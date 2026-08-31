import { platformAdapter } from '../core/platform/platformAdapter';

/**
 * Service Worker Registration & Lifecycle Management
 */

export interface ServiceWorkerUpdateEventDetail {
  registration: ServiceWorkerRegistration;
  waitingWorker: ServiceWorker;
}

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  // Native Shells (Windows Tauri & Android Capacitor) do not require PWA service worker
  if (platformAdapter.isNative()) {
    return Promise.resolve(null);
  }

  // Allow registration in production or if explicitly enabled
  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      // Check if an updated worker is already waiting
      if (registration.waiting) {
        dispatchUpdateEvent(registration, registration.waiting);
      }

      // Detect newly installed workers
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (
            installingWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New version ready to activate
            dispatchUpdateEvent(registration, installingWorker);
          }
        });
      });

      return registration;
    })
    .catch((err) => {
      // Graceful degradation: Service worker failure does not block the application
      console.warn('[PWA] Service worker registration failed:', err);
      return null;
    });
}

function dispatchUpdateEvent(
  registration: ServiceWorkerRegistration,
  waitingWorker: ServiceWorker
) {
  window.dispatchEvent(
    new CustomEvent<ServiceWorkerUpdateEventDetail>('cinetheme-pwa-update', {
      detail: { registration, waitingWorker },
    })
  );
}
