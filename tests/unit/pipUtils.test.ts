import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isPipSupported,
  isPipActive,
  requestPip,
  exitPip,
  togglePip,
} from '../../src/utils/pipUtils';

describe('Picture-in-Picture Utilities', () => {
  let video: HTMLVideoElement;

  beforeEach(() => {
    video = document.createElement('video');
  });

  it('detects PiP support and active state without throwing errors', () => {
    expect(typeof isPipSupported()).toBe('boolean');
    expect(typeof isPipActive()).toBe('boolean');
  });

  it('requests PiP when supported', async () => {
    const pipSpy = vi.fn().mockResolvedValue({} as PictureInPictureWindow);
    video.requestPictureInPicture = pipSpy;
    (document as unknown as { pictureInPictureEnabled: boolean }).pictureInPictureEnabled = true;

    await requestPip(video);
    expect(pipSpy).toHaveBeenCalled();
  });

  it('calls exitPip safely', async () => {
    const exitPipSpy = vi.fn().mockResolvedValue(undefined);
    (document as unknown as { exitPictureInPicture: () => Promise<void> }).exitPictureInPicture = exitPipSpy;
    (document as unknown as { pictureInPictureElement: HTMLVideoElement }).pictureInPictureElement = video;

    await exitPip();
    expect(exitPipSpy).toHaveBeenCalled();
  });

  it('toggles PiP gracefully', async () => {
    const pipSpy = vi.fn().mockResolvedValue({} as PictureInPictureWindow);
    video.requestPictureInPicture = pipSpy;
    (document as unknown as { pictureInPictureEnabled: boolean }).pictureInPictureEnabled = true;
    (document as unknown as { pictureInPictureElement: null }).pictureInPictureElement = null;

    await togglePip(video);
    expect(pipSpy).toHaveBeenCalled();
  });
});
