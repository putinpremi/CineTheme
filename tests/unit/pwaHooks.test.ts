import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../../src/pwa/useNetworkStatus';
import { usePwaUpdate } from '../../src/pwa/usePwaUpdate';
import { usePwaInstall } from '../../src/pwa/usePwaInstall';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';

describe('PWA Custom Hooks Unit Tests', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useNetworkStatus', () => {
    it('detects online and offline network events', () => {
      const { result } = renderHook(() => useNetworkStatus());
      expect(result.current.isOnline).toBe(true);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.isOnline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('usePwaUpdate', () => {
    it('handles pwa update events and suppresses prompt during active playback', () => {
      const { result } = renderHook(() => usePwaUpdate());
      expect(result.current.hasUpdate).toBe(false);

      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as ServiceWorker;

      // Dispatch update event
      act(() => {
        window.dispatchEvent(
          new CustomEvent('cinetheme-pwa-update', {
            detail: {
              registration: {} as ServiceWorkerRegistration,
              waitingWorker: mockWorker,
            },
          })
        );
      });

      expect(result.current.hasUpdate).toBe(true);

      // Verify prompt is suppressed when player is actively playing
      act(() => {
        usePlayerStore.setState({ playerState: 'PLAYING' });
      });
      expect(result.current.hasUpdate).toBe(false);

      // Restoring idle/paused state re-exposes update notification
      act(() => {
        usePlayerStore.setState({ playerState: 'PAUSED' });
      });
      expect(result.current.hasUpdate).toBe(true);
    });

    it('posts SKIP_WAITING to waiting worker on applyUpdate', () => {
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as ServiceWorker;

      const { result } = renderHook(() => usePwaUpdate());

      act(() => {
        window.dispatchEvent(
          new CustomEvent('cinetheme-pwa-update', {
            detail: {
              registration: {} as ServiceWorkerRegistration,
              waitingWorker: mockWorker,
            },
          })
        );
      });

      act(() => {
        result.current.applyUpdate();
      });

      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    it('allows dismissing update notification', () => {
      const mockWorker = {
        postMessage: vi.fn(),
      } as unknown as ServiceWorker;

      const { result } = renderHook(() => usePwaUpdate());

      act(() => {
        window.dispatchEvent(
          new CustomEvent('cinetheme-pwa-update', {
            detail: {
              registration: {} as ServiceWorkerRegistration,
              waitingWorker: mockWorker,
            },
          })
        );
      });

      expect(result.current.hasUpdate).toBe(true);

      act(() => {
        result.current.dismissUpdate();
      });

      expect(result.current.hasUpdate).toBe(false);
    });
  });

  describe('usePwaInstall', () => {
    it('captures beforeinstallprompt event and triggers prompt', async () => {
      const promptMock = vi.fn().mockResolvedValue(undefined);
      const userChoiceMock = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

      const mockEvent = new Event('beforeinstallprompt') as Event & {
        prompt: typeof promptMock;
        userChoice: typeof userChoiceMock;
      };
      mockEvent.prompt = promptMock;
      mockEvent.userChoice = userChoiceMock;

      const { result } = renderHook(() => usePwaInstall());
      expect(result.current.canInstall).toBe(false);

      act(() => {
        window.dispatchEvent(mockEvent);
      });

      expect(result.current.canInstall).toBe(true);

      await act(async () => {
        await result.current.promptInstall();
      });

      expect(promptMock).toHaveBeenCalledTimes(1);
      expect(result.current.isInstalled).toBe(true);
      expect(result.current.canInstall).toBe(false);
    });
  });
});
