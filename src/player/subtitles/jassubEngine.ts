import workerUrl from 'jassub/dist/wasm/jassub-worker.js?url';
import wasmUrl from 'jassub/dist/wasm/jassub-worker.wasm?url';
import modernWasmUrl from 'jassub/dist/wasm/jassub-worker-modern.wasm?url';
import type JASSUB from 'jassub';
import { fontManager, type FontAttachmentInfo } from './fontManager';

export interface JassubEngineOptions {
  video: HTMLVideoElement;
  subUrl: string;
  fontAttachments?: FontAttachmentInfo[];
  timeOffset?: number;
}

export class JassubEngine {
  private instance: JASSUB | null = null;
  private isDestroyed = false;
  private activeVideo: HTMLVideoElement | null = null;

  public async attach(options: JassubEngineOptions): Promise<void> {
    this.destroy();
    this.isDestroyed = false;
    this.activeVideo = options.video;

    try {
      // Lazy load JASSUB / Wasm only on demand when ASS/SSA subtitles are active
      const { default: JASSUBConstructor } = await import('jassub');

      if (this.isDestroyed || !this.activeVideo) return;

      // Asynchronously pre-fetch available font attachments
      let loadedFonts: string[] = [];
      if (options.fontAttachments && options.fontAttachments.length > 0) {
        loadedFonts = await fontManager.loadFonts(options.fontAttachments);
      }

      if (this.isDestroyed || !this.activeVideo) return;

      this.instance = new JASSUBConstructor({
        video: options.video,
        subUrl: options.subUrl,
        fonts: loadedFonts,
        timeOffset: options.timeOffset || 0,
        prescaleFactor: 1.0,
        workerUrl,
        wasmUrl,
        modernWasmUrl,
      });
    } catch (err) {
      console.warn(
        '[Subtitles] JASSUB renderer initialization failed; ASS will degrade safely:',
        (err as Error)?.message || err
      );
      this.instance = null;
    }
  }

  public setTimeOffset(seconds: number): void {
    if (this.instance && !this.isDestroyed) {
      try {
        this.instance.timeOffset = seconds;
      } catch {
        // Ignore offset adjustment error
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.activeVideo = null;
    if (this.instance) {
      try {
        this.instance.destroy();
      } catch {
        // Ignore worker termination errors
      }
      this.instance = null;
    }
    fontManager.clear();
  }
}
