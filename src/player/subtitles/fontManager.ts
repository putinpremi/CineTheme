import { buildApiUrl } from '../../api/client/urlUtils';
import type { MediaAttachmentDto } from '../../api/types/jellyfinDto';

export interface FontAttachmentInfo {
  index: number;
  name: string;
  mimeType?: string;
  url: string;
}

export class FontManager {
  private fontCache = new Map<string, string>();
  private activeAbortController: AbortController | null = null;

  /**
   * Filters and extracts font attachment endpoints from Jellyfin MediaAttachments.
   */
  public discoverFontAttachments(
    serverUrl: string,
    itemId: string,
    mediaSourceId: string,
    token: string,
    attachments: MediaAttachmentDto[] = []
  ): FontAttachmentInfo[] {
    const isFontMime = (mime?: string) =>
      mime?.includes('font') ||
      mime?.includes('opentype') ||
      mime?.includes('truetype') ||
      mime?.includes('sfnt') ||
      mime?.includes('woff');

    const isFontExt = (name?: string) =>
      name?.endsWith('.ttf') ||
      name?.endsWith('.otf') ||
      name?.endsWith('.woff') ||
      name?.endsWith('.woff2');

    return attachments
      .filter((att) => isFontMime(att.MimeType) || isFontExt(att.Name) || isFontExt(att.FileName))
      .map((att, idx) => {
        const attachmentIndex = att.Index ?? idx;
        const fontUrl = buildApiUrl(
          serverUrl,
          `/Videos/${itemId}/${mediaSourceId}/Attachments/${attachmentIndex}`,
          { api_key: token }
        );

        return {
          index: attachmentIndex,
          name: att.Name || att.FileName || `font-${attachmentIndex}`,
          mimeType: att.MimeType,
          url: fontUrl,
        };
      });
  }

  /**
   * Pre-loads font attachment URLs or retrieves from in-memory cache.
   * Returns list of usable font URLs for JASSUB.
   */
  public async loadFonts(
    fonts: FontAttachmentInfo[],
    signal?: AbortSignal
  ): Promise<string[]> {
    this.activeAbortController?.abort();
    this.activeAbortController = new AbortController();

    const effectiveSignal = signal || this.activeAbortController.signal;
    const loadedUrls: string[] = [];

    for (const font of fonts) {
      if (effectiveSignal.aborted) break;

      if (this.fontCache.has(font.name)) {
        loadedUrls.push(this.fontCache.get(font.name)!);
        continue;
      }

      try {
        // Fetch font binary to verify availability and cache as Object URL
        const res = await fetch(font.url, { signal: effectiveSignal });
        if (res.ok) {
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          this.fontCache.set(font.name, objectUrl);
          loadedUrls.push(objectUrl);
        }
      } catch {
        // Silently fallback if font attachment returns 404 or network aborts
      }
    }

    return loadedUrls;
  }

  /**
   * Cleans up all cached font Object URLs and aborts in-flight fetches.
   */
  public clear(): void {
    this.activeAbortController?.abort();
    this.activeAbortController = null;

    for (const objectUrl of this.fontCache.values()) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Ignore revocation error
      }
    }
    this.fontCache.clear();
  }
}

export const fontManager = new FontManager();
