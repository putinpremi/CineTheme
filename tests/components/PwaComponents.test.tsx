import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OfflineBanner } from '../../src/components/pwa/OfflineBanner';
import { PwaUpdateToast } from '../../src/components/pwa/PwaUpdateToast';
import { InstallButton } from '../../src/components/pwa/InstallButton';

describe('PWA UI Components', () => {
  describe('OfflineBanner Component', () => {
    it('renders alert when offline and hides when online', () => {
      const { rerender } = render(<OfflineBanner />);

      // Initially online
      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      // Trigger offline event
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      rerender(<OfflineBanner />);

      expect(screen.getByRole('status')).toBeVisible();
      expect(screen.getByText(/You are currently offline/i)).toBeVisible();

      // Trigger online event
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      rerender(<OfflineBanner />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('PwaUpdateToast Component', () => {
    it('renders update toast when update event is received and handles actions', () => {
      const mockWorker = { postMessage: vi.fn() } as unknown as ServiceWorker;
      const { rerender } = render(<PwaUpdateToast />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

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
      rerender(<PwaUpdateToast />);

      expect(screen.getByRole('alert')).toBeVisible();
      expect(screen.getByText(/New Version Available/i)).toBeVisible();

      // Click Update Now
      const updateBtn = screen.getByRole('button', { name: /Update Now/i });
      fireEvent.click(updateBtn);
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
  });

  describe('InstallButton Component', () => {
    it('renders only when beforeinstallprompt event is fired', () => {
      const { rerender } = render(<InstallButton />);
      expect(screen.queryByRole('button', { name: /Install CineTheme App/i })).not.toBeInTheDocument();

      const promptMock = vi.fn().mockResolvedValue(undefined);
      const mockEvent = new Event('beforeinstallprompt') as Event & {
        prompt: typeof promptMock;
        userChoice: Promise<{ outcome: string }>;
      };
      mockEvent.prompt = promptMock;
      mockEvent.userChoice = Promise.resolve({ outcome: 'dismissed' });

      act(() => {
        window.dispatchEvent(mockEvent);
      });
      rerender(<InstallButton />);

      const installBtn = screen.getByRole('button', { name: /Install CineTheme App/i });
      expect(installBtn).toBeVisible();

      fireEvent.click(installBtn);
      expect(promptMock).toHaveBeenCalledTimes(1);
    });
  });
});
