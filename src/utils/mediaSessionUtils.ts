/**
 * Media Session API utility for integrating with OS media controls, lock screens, and hardware keys.
 */

export interface MediaSessionMetadataOptions {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
}

export interface MediaSessionActionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
}

export function isMediaSessionSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'mediaSession' in navigator && !!navigator.mediaSession;
}

export function setMediaSessionMetadata(options: MediaSessionMetadataOptions): void {
  if (!isMediaSessionSupported() || typeof MediaMetadata === 'undefined') return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: options.title,
      artist: options.artist || 'CineTheme',
      album: options.album || '',
      artwork: options.artworkUrl
        ? [
            { src: options.artworkUrl, sizes: '512x512', type: 'image/webp' },
            { src: options.artworkUrl, sizes: '192x192', type: 'image/webp' },
          ]
        : [],
    });
  } catch {
    // Ignore metadata assignment error
  }
}

export function setMediaSessionHandlers(handlers: MediaSessionActionHandlers): () => void {
  if (!isMediaSessionSupported()) return () => {};

  const actionMap: Array<[MediaSessionAction, (() => void) | undefined]> = [
    ['play', handlers.onPlay],
    ['pause', handlers.onPause],
    ['seekbackward', handlers.onSeekBackward],
    ['seekforward', handlers.onSeekForward],
    ['previoustrack', handlers.onPreviousTrack],
    ['nexttrack', handlers.onNextTrack],
  ];

  for (const [action, handler] of actionMap) {
    try {
      if (handler) {
        navigator.mediaSession.setActionHandler(action, handler);
      } else {
        navigator.mediaSession.setActionHandler(action, null);
      }
    } catch {
      // Browser might not support this specific action handler
    }
  }

  return () => {
    if (!isMediaSessionSupported()) return;
    for (const [action] of actionMap) {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {
        // Ignore
      }
    }
  };
}
