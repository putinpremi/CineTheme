import { redactMediaUrl } from '../streamUrlBuilder';

function srtToVtt(content: string): string {
  if (content.trim().startsWith('WEBVTT')) {
    return content;
  }
  // Convert SRT timestamps (00:00:00,000) to WebVTT format (00:00:00.000)
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${normalized}`;
}

export class WebVttEngine {
  private video: HTMLVideoElement | null = null;
  private trackElement: HTMLTrackElement | null = null;
  private activeBlobUrl: string | null = null;
  private currentOffset = 0;

  public async attach(
    video: HTMLVideoElement,
    url: string,
    language = 'en',
    label = 'Subtitles',
    timeOffset = 0
  ): Promise<void> {
    this.detach();
    this.video = video;
    this.currentOffset = timeOffset;

    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = label;
    track.srclang = language;
    track.default = true;

    try {
      // Fetch subtitle payload directly to bypass cross-origin <track> restrictions and handle SRT formats
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const rawText = await res.text();
      const vttText = srtToVtt(rawText);

      const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      this.activeBlobUrl = blobUrl;
      track.src = blobUrl;
    } catch (err) {
      console.warn(
        '[Subtitles] Failed to fetch/parse subtitle stream, attempting direct track fallback:',
        redactMediaUrl(url),
        (err as Error)?.message || err
      );
      track.src = url;
    }

    if (!this.video) {
      if (this.activeBlobUrl) {
        try {
          URL.revokeObjectURL(this.activeBlobUrl);
        } catch {
          // ignore
        }
        this.activeBlobUrl = null;
      }
      return;
    }

    track.addEventListener('load', () => {
      this.applyOffsetToCues(this.currentOffset);
    });

    track.addEventListener('error', (e) => {
      console.warn('[Subtitles] TextTrack error event:', e);
    });

    this.video.appendChild(track);
    this.trackElement = track;

    if (this.video.textTracks && this.video.textTracks.length > 0) {
      for (let i = 0; i < this.video.textTracks.length; i++) {
        const textTrack = this.video.textTracks[i];
        if (textTrack) {
          textTrack.mode = 'showing';
        }
      }
    }
  }

  public setTimeOffset(newOffsetSeconds: number): void {
    const delta = newOffsetSeconds - this.currentOffset;
    this.currentOffset = newOffsetSeconds;
    this.applyDeltaToCues(delta);
  }

  private applyOffsetToCues(offset: number): void {
    if (offset === 0 || !this.trackElement?.track?.cues) return;
    const cues = this.trackElement.track.cues;
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i] as VTTCue;
      if (cue) {
        cue.startTime += offset;
        cue.endTime += offset;
      }
    }
  }

  private applyDeltaToCues(delta: number): void {
    if (delta === 0 || !this.trackElement?.track?.cues) return;
    const cues = this.trackElement.track.cues;
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i] as VTTCue;
      if (cue) {
        cue.startTime += delta;
        cue.endTime += delta;
      }
    }
  }

  public detach(): void {
    if (this.activeBlobUrl) {
      try {
        URL.revokeObjectURL(this.activeBlobUrl);
      } catch {
        // Ignore revoke error
      }
      this.activeBlobUrl = null;
    }

    if (this.trackElement && this.video) {
      if (this.trackElement.parentNode === this.video) {
        this.video.removeChild(this.trackElement);
      }
      this.trackElement = null;
    }
    this.video = null;
    this.currentOffset = 0;
  }
}
