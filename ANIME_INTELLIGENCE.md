# CineTheme Anime Intelligence Specification & Architecture

This document specifies the anime-oriented playback intelligence, chapter processing, IntroSkipper integration, Trickplay thumbnail scrubbing, episode navigation, and playback preference architecture in CineTheme.

---

## 1. Core Principles

1. **Web-First & Jellyfin Native**: CineTheme operates strictly against real Jellyfin server APIs (Jellyfin 10.8.x, 10.9.x, 10.10+). No external piracy APIs, scrapers, or third-party databases.
2. **Deterministic Priority**:
   - **Priority 1**: Verified IntroSkipper plugin timestamps (when installed on the host server).
   - **Priority 2**: Explicit Jellyfin chapter metadata (`BaseItemDto.Chapters`).
   - **Priority 3**: Standard playback without automated skips.
3. **Resilience & Non-Interference**: If chapters or plugins are unavailable, video playback remains pristine with zero broken state or console error noise.

---

## 2. Chapter API & Normalization

### 2.1 Jellyfin Chapter Model
Jellyfin delivers embedded chapters in `BaseItemDto.Chapters`:
```typescript
export interface ChapterInfoDto {
  StartPositionTicks: number;
  Name?: string;
  ImageTag?: string;
  ImagePath?: string;
  MarkerType?: string;
  ChapterIndex?: number;
}
```

### 2.2 Domain Normalization (`chapterParser.ts`)
Raw chapter titles are cleaned and normalized through deterministic regular expressions:
- **Intro / OP**: `/^(opening(\s+theme)?|op(\s*\d+)?|intro(duction)?)\b/i`
- **Outro / ED / Credits**: `/^(ending(\s+theme)?|ed(\s*\d+)?|outro|credits)\b/i`
- **Recap**: `/^(recap|summary|previously(\s+on)?)\b/i`
- **Preview**: `/^(preview|next\s+episode(\s+preview)?|next\s+time)\b/i`

End timestamps are derived from the succeeding chapter's `StartPositionTicks` or media item duration.

---

## 3. Intro & Outro Detection (`introDetector.ts`)

`IntroDetector` produces typed `AnimeSegment` objects:
```typescript
export interface AnimeSegment {
  type: 'INTRO' | 'OUTRO' | 'RECAP' | 'PREVIEW' | 'OTHER';
  title: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  source: 'IntroSkipperPlugin' | 'ChapterMetadata';
  confidence: number;
}
```

### 3.1 Active Segment Resolution
- Segment detection is evaluated against `currentTime` using low-overhead array lookups.
- Segment transitions trigger a lightweight floating action button (`[ Skip Intro ]`, `[ Skip Outro ]`) without re-rendering the 60Hz player HUD.

---

## 4. Skip Button Lifecycle & Telemetry Safety

1. **Instant Seeking**: Clicking `[ Skip Intro ]` invokes `PlayerController.seek(segment.endTimeSeconds)` without reloading the HTML5 video element or recreating the MSE/HLS pipeline.
2. **Cooldown & Boundary Protection**: Once a segment is skipped or exited, boundary tracking prevents the button from bouncing back into view.
3. **Telemetry Fidelity**: Seeks trigger a debounced `PlaybackProgress(EventName: 'Seek')` with the exact new timestamp, avoiding duplicate session creation or progress inflation.

---

## 5. Optional IntroSkipper Plugin Integration (`introSkipperService.ts`)

- **Probing Path**: `GET /Episode/{itemId}/IntroTimestamps` and fallback `GET /Plugin/IntroSkipper/Timestamps/{itemId}`.
- **Fail-Safe Contract**: Uses a short 2.5-second timeout. If the plugin returns 404, 500, or times out, the endpoint is cached as unavailable for the session, smoothly falling back to native chapters.

---

## 6. Trickplay Timeline Thumbnails (`trickplayService.ts`)

- **Manifest Format (Jellyfin 10.9+)**:
  `GET /Items/{itemId}/Trickplay/{width}/GetManifest`
  ```json
  {
    "Width": 320,
    "Height": 180,
    "TileWidth": 10,
    "TileHeight": 10,
    "ThumbnailCount": 600,
    "Interval": 10000
  }
  ```
- **Tile Coordinate Derivation**:
  - `frameIndex = Math.floor((hoverTimeSeconds * 1000) / manifest.intervalMs)`
  - `sheetIndex = Math.floor(frameIndex / (tileWidth * tileHeight))`
  - `col = (frameIndex % (tileWidth * tileHeight)) % tileWidth`
  - `row = Math.floor((frameIndex % (tileWidth * tileHeight)) / tileWidth)`
  - `offsetX = col * singleThumbWidth`, `offsetY = row * singleThumbHeight`
- **Fallback**: If trickplay is unavailable or generating, timeline displays the standard glassmorphic timecode tooltip.

---

## 7. Episode Hierarchy & Auto-Next Countdown

- **Sequence Resolution**: `GET /Shows/{seriesId}/Episodes?seasonId={seasonId}` resolves current, previous, and next episodes in the season.
- **Next Episode Countdown**:
  - Automatically triggers when remaining duration $\le 25\text{s}$ or video reaches `ENDED`.
  - Presents a 10-second countdown with **[ Play Now ]** and **[ Dismiss ]** options.
  - When countdown expires and `autoPlayNextEpisode` is true, smoothly transitions via `navigate('/player/' + nextEpisodeId)`.

---

## 8. Playback Preferences Store (`usePlaybackPreferencesStore.ts`)

Persisted in client storage (`cinetheme_playback_prefs`):
- `autoPlayNextEpisode`: Default `true`.
- `autoSkipIntro`: Default `false`.
- `autoSkipOutro`: Default `false`.
- `preferredAudioLanguage`: Optional ISO 639-2 code (e.g. `'jpn'`).
- `preferredSubtitleLanguage`: Optional ISO 639-2 code (e.g. `'eng'`).
- `subtitleMode`: `'Default' | 'Always' | 'OnlyForced' | 'None'`.

### Priority Evaluation:
$$\text{Session Override (Manual Selection)} \longrightarrow \text{User Preference} \longrightarrow \text{Server Default Track}$$

---

## 9. Security & Memory Integrity

1. Authenticated tile image URLs containing `api_key` are never logged to console or persisted to local storage.
2. AbortControllers and event listeners are torn down when switching between episodes.
