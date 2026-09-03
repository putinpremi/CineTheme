import * as React from 'react';
import type { PlayerController } from '../player/playerController';
import { toggleFullscreen } from '../utils/fullscreenUtils';

export interface UsePlayerHotkeysOptions {
  controllerRef: React.RefObject<PlayerController | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  onCloseMenu?: () => void;
  isMenuOpen?: boolean;
}

export function usePlayerHotkeys({
  controllerRef,
  containerRef,
  onCloseMenu,
  isMenuOpen = false,
}: UsePlayerHotkeysOptions) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evasion: Ignore hotkeys if user is actively typing in input/textarea/editable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const controller = controllerRef.current;
      if (!controller) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          controller.togglePlay();
          break;

        case 'ArrowLeft':
          if (isMenuOpen) return;
          e.preventDefault();
          controller.seekRelative(e.shiftKey ? -30 : -10);
          break;

        case 'KeyJ': {
          e.preventDefault();
          const seekAmount = e.shiftKey ? -30 : -10;
          controller.seekRelative(seekAmount);
          break;
        }

        case 'ArrowRight':
          if (isMenuOpen) return;
          e.preventDefault();
          controller.seekRelative(e.shiftKey ? 30 : 10);
          break;

        case 'KeyL': {
          e.preventDefault();
          const seekAmount = e.shiftKey ? 30 : 10;
          controller.seekRelative(seekAmount);
          break;
        }

        case 'ArrowUp':
          if (isMenuOpen) return;
          e.preventDefault();
          controller.adjustVolume(0.05);
          break;

        case 'ArrowDown':
          if (isMenuOpen) return;
          e.preventDefault();
          controller.adjustVolume(-0.05);
          break;

        case 'KeyM':
          e.preventDefault();
          controller.toggleMute();
          break;

        case 'KeyF':
          e.preventDefault();
          if (containerRef.current) {
            toggleFullscreen(containerRef.current);
          }
          break;

        case 'Escape':
          if (isMenuOpen && onCloseMenu) {
            e.preventDefault();
            onCloseMenu();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [controllerRef, containerRef, onCloseMenu, isMenuOpen]);
}
