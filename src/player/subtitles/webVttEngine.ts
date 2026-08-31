export class WebVttEngine {
  private video: HTMLVideoElement | null = null;
  private trackElement: HTMLTrackElement | null = null;

  public attach(video: HTMLVideoElement, url: string, language = 'en', label = 'Subtitles'): void {
    this.detach();
    this.video = video;

    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = label;
    track.srclang = language;
    track.src = url;
    track.default = true;

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

  public detach(): void {
    if (this.trackElement && this.video) {
      if (this.trackElement.parentNode === this.video) {
        this.video.removeChild(this.trackElement);
      }
      this.trackElement = null;
    }
    this.video = null;
  }
}
