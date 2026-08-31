import * as React from 'react';
import { spatialNavigation } from './spatialNavigation';
import { platformAdapter } from '../../core/platform/platformAdapter';

export interface UseSpatialNavigationOptions {
  enabled?: boolean;
  routeKey?: string;
}

export function useSpatialNavigation(options: UseSpatialNavigationOptions = {}) {
  const { enabled = true, routeKey = window.location.pathname } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept spatial navigation if user is actively typing in a text input or textarea
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        (target as HTMLInputElement).type !== 'button' &&
        (target as HTMLInputElement).type !== 'checkbox' &&
        (target as HTMLInputElement).type !== 'radio';

      // Remote / D-pad Key Codes
      switch (e.key) {
        case 'ArrowUp':
          if (isTyping && target.tagName === 'TEXTAREA') break;
          e.preventDefault();
          spatialNavigation.moveFocus('up');
          break;

        case 'ArrowDown':
          if (isTyping && target.tagName === 'TEXTAREA') break;
          e.preventDefault();
          spatialNavigation.moveFocus('down');
          break;

        case 'ArrowLeft':
          if (isTyping) break; // Allow cursor movement inside text input
          e.preventDefault();
          spatialNavigation.moveFocus('left');
          break;

        case 'ArrowRight':
          if (isTyping) break; // Allow cursor movement inside text input
          e.preventDefault();
          spatialNavigation.moveFocus('right');
          break;

        case 'Enter':
          // Standard D-pad Center / OK button activates active focused target
          break;

        default:
          // Check Android TV numeric keycodes if key string is missing
          if (e.keyCode === 19) {
            e.preventDefault();
            spatialNavigation.moveFocus('up');
          } else if (e.keyCode === 20) {
            e.preventDefault();
            spatialNavigation.moveFocus('down');
          } else if (e.keyCode === 21 && !isTyping) {
            e.preventDefault();
            spatialNavigation.moveFocus('left');
          } else if (e.keyCode === 22 && !isTyping) {
            e.preventDefault();
            spatialNavigation.moveFocus('right');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });

    // Initial focus on mount / route change
    const timer = setTimeout(() => {
      if (platformAdapter.isTVMode()) {
        spatialNavigation.restoreFocusState(routeKey);
      }
    }, 150);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      clearTimeout(timer);
      spatialNavigation.saveFocusState(routeKey);
    };
  }, [enabled, routeKey]);
}
