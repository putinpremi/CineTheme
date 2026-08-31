/**
 * Cross-browser Fullscreen API utility with graceful fallbacks.
 */

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(
    document.fullscreenEnabled ||
    (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
    (document as unknown as { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
    (document as unknown as { msFullscreenEnabled?: boolean }).msFullscreenEnabled
  );
}

export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
    (document as unknown as { mozFullScreenElement?: Element }).mozFullScreenElement ||
    (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
  );
}

export async function requestFullscreen(element: HTMLElement): Promise<void> {
  if (!element) return;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
      await (element as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
    } else if ((element as unknown as { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
      await (element as unknown as { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
    } else if ((element as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
      await (element as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
    }
  } catch {
    // Browsers reject fullscreen if not triggered by direct user gesture
  }
}

export async function exitFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;

  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
      await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
    } else if ((document as unknown as { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
      await (document as unknown as { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
    } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
      await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
    }
  } catch {
    // Ignore exit failure if already not in fullscreen
  }
}

export async function toggleFullscreen(element: HTMLElement): Promise<void> {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    await requestFullscreen(element);
  }
}
