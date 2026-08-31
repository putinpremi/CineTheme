/**
 * Cross-browser Picture-in-Picture (PiP) API utility with feature detection.
 */

export function isPipSupported(): boolean {
  if (typeof document === 'undefined') return false;
  return 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;
}

export function isPipActive(): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.pictureInPictureElement;
}

export async function requestPip(video: HTMLVideoElement): Promise<PictureInPictureWindow | void> {
  if (!video || !isPipSupported()) return;

  try {
    return await video.requestPictureInPicture();
  } catch {
    // Graceful fallback if PiP is disabled or rejected
  }
}

export async function exitPip(): Promise<void> {
  if (typeof document === 'undefined' || !isPipActive()) return;

  try {
    await document.exitPictureInPicture();
  } catch {
    // Ignore exit rejection
  }
}

export async function togglePip(video: HTMLVideoElement): Promise<void> {
  if (isPipActive()) {
    await exitPip();
  } else {
    await requestPip(video);
  }
}
