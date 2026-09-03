export type Direction = 'up' | 'down' | 'left' | 'right';

export interface SpatialNavigationOptions {
  container?: HTMLElement | Document;
  trapModal?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"]):not([aria-hidden="true"])',
  'button:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]):not([aria-hidden="true"])',
  'select:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  'textarea:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  '[tabindex="0"]:not([disabled]):not([aria-hidden="true"])',
  '[data-tv-focusable="true"]:not([disabled]):not([aria-hidden="true"])',
].join(', ');

export class SpatialNavigationEngine {
  private lastFocusedMap = new Map<string, HTMLElement>();

  /**
   * Retrieves all currently visible and interactive focusable elements.
   */
  public getFocusableElements(container: HTMLElement | Document = document): HTMLElement[] {
    // Check if an open modal/dialog is present with explicit modal semantics
    const openModal = document.querySelector<HTMLElement>(
      'dialog[open], [role="dialog"][aria-modal="true"]:not([aria-hidden="true"]), [aria-modal="true"]:not([aria-hidden="true"])'
    );

    const searchRoot = openModal && (openModal.contains(document.activeElement) || !container.contains(document.activeElement))
      ? openModal
      : container;
    const elements = Array.from(searchRoot.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    return elements.filter((el) => this.isVisible(el));
  }

  /**
   * Determines if a DOM element is visible and rendered on screen.
   */
  public isVisible(element: HTMLElement): boolean {
    if (!element) return false;
    if ((element as HTMLButtonElement | HTMLInputElement).disabled) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;

    // Check style visibility & display
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Finds the best candidate element in the specified direction.
   */
  public findNextCandidate(
    currentElement: HTMLElement,
    direction: Direction,
    container: HTMLElement | Document = document
  ): HTMLElement | null {
    const candidates = this.getFocusableElements(container).filter((el) => el !== currentElement);
    if (candidates.length === 0) return null;

    const currentRect = currentElement.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2,
    };

    let bestCandidate: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const candidate of candidates) {
      const candidateRect = candidate.getBoundingClientRect();
      const candidateCenter = {
        x: candidateRect.left + candidateRect.width / 2,
        y: candidateRect.top + candidateRect.height / 2,
      };

      const deltaX = candidateCenter.x - currentCenter.x;
      const deltaY = candidateCenter.y - currentCenter.y;

      // Filter out elements not in the direction half-plane
      let isDirectional = false;
      let primaryDistance = 0;
      let secondaryDistance = 0;

      switch (direction) {
        case 'up':
          isDirectional = deltaY < -2 && candidateRect.bottom <= currentRect.top + 10;
          primaryDistance = Math.abs(deltaY);
          secondaryDistance = Math.abs(deltaX);
          break;
        case 'down':
          isDirectional = deltaY > 2 && candidateRect.top >= currentRect.bottom - 10;
          primaryDistance = Math.abs(deltaY);
          secondaryDistance = Math.abs(deltaX);
          break;
        case 'left':
          isDirectional = deltaX < -2 && candidateRect.right <= currentRect.left + 10;
          primaryDistance = Math.abs(deltaX);
          secondaryDistance = Math.abs(deltaY);
          break;
        case 'right':
          isDirectional = deltaX > 2 && candidateRect.left >= currentRect.right - 10;
          primaryDistance = Math.abs(deltaX);
          secondaryDistance = Math.abs(deltaY);
          break;
      }

      if (!isDirectional) continue;

      // Distance metric: Primary distance + heavy penalty on orthogonal deviation (favoring aligned elements)
      const distance = primaryDistance + secondaryDistance * 2.5;

      if (distance < minDistance) {
        minDistance = distance;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Moves focus in the given direction. Returns true if focus was successfully moved.
   */
  public moveFocus(direction: Direction, container: HTMLElement | Document = document): boolean {
    const activeEl = document.activeElement as HTMLElement | null;

    if (!activeEl || activeEl === document.body || !this.isVisible(activeEl)) {
      // Focus initial candidate
      return this.focusInitial(container);
    }

    const nextEl = this.findNextCandidate(activeEl, direction, container);
    if (nextEl) {
      this.focusElement(nextEl);
      return true;
    }

    return false;
  }

  /**
   * Focuses an element smoothly and scrolls it into view.
   */
  public focusElement(element: HTMLElement): void {
    if (!element) return;
    element.focus({ preventScroll: false });

    // Ensure element is smoothly in viewport if method is supported by environment
    if (typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }

  /**
   * Automatically sets focus to the first logical candidate on screen.
   */
  public focusInitial(container: HTMLElement | Document = document): boolean {
    const candidates = this.getFocusableElements(container);
    if (candidates.length > 0 && candidates[0]) {
      this.focusElement(candidates[0]);
      return true;
    }
    return false;
  }

  /**
   * Remembers the current focused element for a route key.
   */
  public saveFocusState(routeKey: string): void {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body) {
      this.lastFocusedMap.set(routeKey, active);
    }
  }

  /**
   * Restores previously saved focus or focuses initial candidate.
   */
  public restoreFocusState(routeKey: string, container: HTMLElement | Document = document): void {
    const saved = this.lastFocusedMap.get(routeKey);
    if (saved && document.body.contains(saved) && this.isVisible(saved)) {
      this.focusElement(saved);
    } else {
      this.focusInitial(container);
    }
  }
}

export const spatialNavigation = new SpatialNavigationEngine();
