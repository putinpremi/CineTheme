export class WebVttEngine {
  private video: HTMLVideoElement | null = null;
  private trackElement: HTMLTrackElement | null = null;
  private currentOffset = 0;

  public attach(video: HTMLVideoElement, url: string, language = 'en', label = 'Subtitles', timeOffset = 0): void {
    this.detach();
    this.video = video;
    this.currentOffset = timeOffset;

    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = label;
    track.srclang = language;
    track.src = url;
    track.default = true;

    track.addEventListener('load', () => {
      this.applyOffsetToCues(this.currentOffset);
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
