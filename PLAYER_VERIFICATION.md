# Jellyfin Playback Architecture & API Verification Reference

This document provides an exhaustive, authoritative technical verification of the Jellyfin media playback pipeline, streaming protocols, session telemetry, container/codec negotiation, subtitle delivery, and browser playback engines for Jellyfin Server versions 10.8.x, 10.9.x, and 10.10+.

---

## 1. Complete Playback Lifecycle & Protocol Mechanics

### 1.1 PlaybackInfo Request & Response
- **Endpoint:** `POST /Items/{itemId}/PlaybackInfo?userId={userId}`
- **Headers:** 
  - `Content-Type: application/json`
  - `X-Emby-Authorization: MediaBrowser Client="CineTheme", Device="{device}", DeviceId="{id}", Version="{version}", Token="{accessToken}"`
- **Request Payload (`PlaybackInfoDto`):**
  ```json
  {
    "UserId": "a1b2c3d4e5f678901234567890abcdef",
    "MaxStreamingBitrate": 120000000,
    "StartTimeTicks": 0,
    "AudioStreamIndex": 1,
    "SubtitleStreamIndex": 2,
    "MediaSourceId": "source-guid-1234",
    "DeviceProfile": {
      "Name": "CineTheme Web Player",
      "Id": "cinetheme-web-v1",
      "MaxStreamingBitrate": 120000000,
      "MaxStaticBitrate": 120000000,
      "DirectPlayProfiles": [
        {
          "Container": "mp4,m4v,webm",
          "Type": "Video",
          "VideoCodec": "h264,hevc,vp9,av1",
          "AudioCodec": "aac,mp3,opus,flac,vorbis"
        },
        {
          "Container": "mp3,aac,flac,opus,ogg,wav",
          "Type": "Audio",
          "AudioCodec": "aac,mp3,opus,flac,vorbis"
        }
      ],
      "TranscodingProfiles": [
        {
          "Container": "ts",
          "Type": "Video",
          "VideoCodec": "h264",
          "AudioCodec": "aac,mp3",
          "Protocol": "hls",
          "Context": "Streaming",
          "BreakOnNonKeyFrames": true
        }
      ],
      "ContainerProfiles": [],
      "CodecProfiles": [],
      "SubtitleProfiles": [
        { "Format": "vtt", "Method": "External" },
        { "Format": "srt", "Method": "External" },
        { "Format": "ass", "Method": "External" },
        { "Format": "ssa", "Method": "External" }
      ],
      "ResponseProfiles": []
    }
  }
  ```
- **Response Shape (`PlaybackInfoResponse`):**
  ```json
  {
    "MediaSources": [
      {
        "Id": "source-guid-1234",
        "Path": "/media/movies/Inception (2010)/Inception.mkv",
        "Protocol": "File",
        "Container": "mkv",
        "Size": 14500000000,
        "Name": "Inception - 1080p - Remux",
        "IsRemote": false,
        "RunTimeTicks": 88800000000,
        "SupportsDirectPlay": false,
        "SupportsDirectStream": true,
        "SupportsTranscoding": true,
        "TranscodingUrl": "/Videos/item-guid-1/master.m3u8?DeviceId=...&MediaSourceId=source-guid-1234&PlaySessionId=sess-123&VideoCodec=h264&AudioCodec=aac&AudioStreamIndex=1&SubtitleStreamIndex=2&TranscodingMaxAudioChannels=2&RequireAvc=false&SegmentContainer=ts&MinSegments=1&BreakOnNonKeyFrames=true",
        "TranscodingSubProtocol": "hls",
        "TranscodingContainer": "ts",
        "Bitrate": 18500000,
        "MediaStreams": [
          {
            "Codec": "h264",
            "CodecTag": "avc1",
            "Language": "eng",
            "IsInterlaced": false,
            "BitRate": 16000000,
            "BitDepth": 8,
            "RefFrames": 4,
            "IsDefault": true,
            "IsForced": false,
            "Height": 1080,
            "Width": 1920,
            "AverageFrameRate": 23.976,
            "RealFrameRate": 23.976,
            "Profile": "High",
            "Type": "Video",
            "AspectRatio": "16:9",
            "Index": 0,
            "IsExternal": false,
            "DeliveryMethod": "Embed",
            "DeliveryUrl": null,
            "SupportsExternalStream": false,
            "PixelFormat": "yuv420p",
            "Level": 41
          },
          {
            "Codec": "dts-hd ma",
            "Language": "eng",
            "Title": "DTS-HD MA 5.1",
            "DisplayTitle": "English DTS-HD MA 5.1 (Default)",
            "IsInterlaced": false,
            "BitRate": 2500000,
            "Channels": 6,
            "SampleRate": 48000,
            "IsDefault": true,
            "IsForced": false,
            "Type": "Audio",
            "Index": 1,
            "IsExternal": false,
            "DeliveryMethod": "Embed",
            "SupportsExternalStream": false
          },
          {
            "Codec": "subrip",
            "Language": "eng",
            "DisplayTitle": "English (Default)",
            "IsDefault": true,
            "IsForced": false,
            "Type": "Subtitle",
            "Index": 2,
            "IsExternal": false,
            "DeliveryMethod": "External",
            "DeliveryUrl": "/Videos/item-guid-1/source-guid-1234/Subtitles/2/Stream.vtt",
            "SupportsExternalStream": true
          }
        ]
      }
    ],
    "PlaySessionId": "playsession-uuid-9876-5432-10fe"
  }
  ```

---

## 2. Deterministic Playback Decision Model

The client determines the playback mode from the `PlaybackInfoResponse` using the following exact priority rules:

```
                          [ MediaSourceInfo ]
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   SupportsDirectPlay == true              SupportsDirectPlay == false
              │                                         │
              ▼                                         ▼
     ┌─────────────────┐                     ┌─────────────────────┐
     │   DIRECT PLAY   │                     │ SupportsDirectStream│
     │  (static=true)  │                     └──────────┬──────────┘
     │ <video src=...> │                                │
     └─────────────────┘               ┌────────────────┴────────────────┐
                                       ▼                                 ▼
                                     true                              false
                                       │                                 │
                         ┌─────────────┴─────────────┐                   ▼
                         ▼                           ▼          ┌─────────────────┐
                 Video Transcoding?          Audio Transcoding? │  TRANSCODING    │
                         │                           │          │ (Video Re-encode│
                   ┌─────┴─────┐               ┌─────┴─────┐    │   via HLS.js)   │
                   ▼           ▼               ▼           ▼    └─────────────────┘
                  No          Yes             No          Yes
                   │           │               │           │
                   ▼           ▼               ▼           ▼
               [ REMUX ]  [TRANSCODE]     [DIRECT     [DIRECT
               (Copy All,                 STREAM:     STREAM:
               HLS Mux)                   Copy Video, Copy Video,
                                          Copy Audio] Audio Transcode]
```

### 2.1 Mode Definitions:
1. **DIRECT_PLAY (`static=true`):**
   - Stream URL: `{serverUrl}/Videos/{itemId}/stream.{container}?static=true&mediaSourceId={mediaSourceId}&playSessionId={playSessionId}&api_key={token}`
   - Stream Delivery: Direct HTTP progressive download with `Range: bytes=` support.
   - Processing overhead on server: $0\%$ CPU, $0\%$ disk I/O transcode cache.
2. **REMUX (Direct Stream with Video & Audio Bitstream Copy):**
   - Stream URL: `{serverUrl}{mediaSource.TranscodingUrl}` (HLS Master Playlist `.m3u8`).
   - Server Action: FFmpeg repackages raw packets into MPEG-TS or fragmented MP4 (`fMP4`) segments without re-encoding video or audio (`-c:v copy -c:a copy`).
3. **DIRECT_STREAM (Video Bitstream Copy + Audio Transcoding):**
   - Stream URL: `{serverUrl}{mediaSource.TranscodingUrl}` (HLS Master Playlist `.m3u8`).
   - Server Action: FFmpeg copies video stream losslessly (`-c:v copy`) and transcodes only unsupported multi-channel or lossless audio (e.g. TrueHD, DTS) to stereo/5.1 AAC or Opus (`-c:a aac -ac 2 -b:a 384k`).
4. **TRANSCODE (Full Video & Audio Re-encoding):**
   - Stream URL: `{serverUrl}{mediaSource.TranscodingUrl}` (HLS Master Playlist `.m3u8`).
   - Server Action: Full software or hardware-accelerated decode and encode (e.g. VAAPI, NVENC, QSV, AMF, VideoToolbox) scaling to client bitrate limit.

---

## 3. Comprehensive Browser Capability Matrix

| Format / Codec / Container | Chrome 120+ (Win/Mac/Linux) | Firefox 125+ (Win/Mac/Linux) | Safari 17+ (macOS / iOS) | Edge 120+ (Windows) | Chrome Android 120+ | Android TV WebView |
|---|---|---|---|---|---|---|
| **Containers** | | | | | | |
| MP4 (`.mp4`, `.m4v`) | **Native Direct** | **Native Direct** | **Native Direct** | **Native Direct** | **Native Direct** | **Native Direct** |
| WebM (`.webm`) | **Native Direct** | **Native Direct** | **Native Direct** (macOS 14+) | **Native Direct** | **Native Direct** | **Native Direct** |
| Matroska (`.mkv`) | Remux required | Remux required | Remux required | Remux required | Remux required | Remux required |
| MPEG-TS (`.ts`) | Hls.js MSE | Hls.js MSE | Native HLS | Hls.js MSE | Hls.js MSE | Native/MSE |
| **Video Codecs** | | | | | | |
| H.264 (AVC Baseline/Main/High) | **Direct** (HW/SW) | **Direct** (HW/SW) | **Direct** (HW) | **Direct** (HW/SW) | **Direct** (HW) | **Direct** (HW) |
| HEVC / H.265 (8-bit & 10-bit) | Direct if HW + OS flag | OS dependent | **Direct** (All modern Mac/iOS) | Direct if HEVC Extension | Direct (HW chip dependent) | **Direct** (HW) |
| VP9 (Profile 0 & 2) | **Direct** (HW/SW) | **Direct** (HW/SW) | **Direct** (macOS 11+) | **Direct** (HW/SW) | **Direct** (HW/SW) | **Direct** (HW) |
| AV1 (`av01`) | **Direct** (HW/SW) | **Direct** (HW/SW) | Direct (M3+ Apple Silicon) | **Direct** (HW/SW) | Direct (HW/SW) | Direct (Android 10+) |
| **Audio Codecs** | | | | | | |
| AAC (LC & HE) | **Direct** | **Direct** | **Direct** | **Direct** | **Direct** | **Direct** |
| MP3 | **Direct** | **Direct** | **Direct** | **Direct** | **Direct** | **Direct** |
| Opus | **Direct** | **Direct** | **Direct** (Safari 15+) | **Direct** | **Direct** | **Direct** |
| FLAC | **Direct** | **Direct** | **Direct** | **Direct** | **Direct** | **Direct** |
| Vorbis | **Direct** | **Direct** | Transcode | **Direct** | **Direct** | **Direct** |
| AC-3 (Dolby Digital) | Transcode | Transcode | **Direct** (macOS/iOS HW) | Direct (Win OS codec) | Transcode (mostly) | **Direct** (Passthrough) |
| E-AC-3 (Dolby Digital Plus) | Transcode | Transcode | **Direct** (macOS/iOS HW) | Direct (Win OS codec) | Transcode (mostly) | **Direct** (Passthrough) |
| DTS / DTS-HD MA | Transcode | Transcode | Transcode | Transcode | Transcode | Transcode / Pass |
| TrueHD / Atmos | Transcode | Transcode | Transcode | Transcode | Transcode | Transcode / Pass |
| **Subtitle Engines** | | | | | | |
| WebVTT (`.vtt`) | **Native TextTrack** | **Native TextTrack** | **Native TextTrack** | **Native TextTrack** | **Native TextTrack** | **Native TextTrack** |
| SubRip (`.srt`) | VTT Convert / TextTrack | VTT Convert / TextTrack | VTT Convert / TextTrack | VTT Convert / TextTrack | VTT Convert / TextTrack | VTT Convert / TextTrack |
| Advanced SubStation (`.ass` / `.ssa`) | **JASSUB Wasm Worker** | **JASSUB Wasm Worker** | **JASSUB Wasm Worker** | **JASSUB Wasm Worker** | **JASSUB Wasm Worker** | **JASSUB Wasm Worker** |
| PGS / VOBSUB (Bitmap) | Server Burn-In | Server Burn-In | Server Burn-In | Server Burn-In | Server Burn-In | Server Burn-In |

---

## 4. Subtitle Delivery & Typography Architecture

### 4.1 Subtitle Delivery Methods
1. **External WebVTT / SRT (`DeliveryMethod: "External"`):**
   - URL: `/Videos/{itemId}/{mediaSourceId}/Subtitles/{index}/Stream.vtt`
   - Rendered using HTML5 `<track kind="subtitles" src="..." default>` or custom overlay parser.
2. **External ASS / SSA (`DeliveryMethod: "External"`):**
   - URL: `/Videos/{itemId}/{mediaSourceId}/Subtitles/{index}/Stream.ass`
   - Rendered using a Wasm-compiled `libass` worker (`JASSUB`) drawing directly onto an HTML5 `<canvas>` positioned atop `<video>`.
3. **Embedded Subtitles Extracted On-the-Fly:**
   - Jellyfin extracts embedded text streams via the subtitle endpoint on demand without requiring server transcoding.
4. **Server Burn-In (`DeliveryMethod: "Encode"`):**
   - Requested when graphical subtitles (PGS `subrip`, DVD `vobsub`, DVB-Sub) are selected and cannot be decoded via Canvas Wasm.
   - Jellyfin overlays the subtitle frames onto the video during FFmpeg transcoding.

### 4.2 Embedded Fonts & Lazy Attachment Ingestion
- In anime MKV files, typesetting fonts are stored in attachment streams.
- **Attachment Endpoint:** `GET /Videos/{itemId}/{mediaSourceId}/Attachments/{attachmentIndex}`
- **Playback Startup Rule:** Never block video playback waiting for font downloads. CineTheme initializes `JASSUB` immediately with bundled fallback sans-serif fonts (Arial, Open Sans, Gandhi Sans) and asynchronously loads and registers font attachments as they download.

---

## 5. Playback Telemetry & Session Lifecycle Protocol

Every playback session establishes a synchronized telemetry loop with Jellyfin to track resume progress, session status in the Jellyfin Dashboard, and auto-play progression:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Player as CineTheme Player Controller
    participant Telemetry as Telemetry Service
    participant Server as Jellyfin Server

    User->>Player: Open Media (Inception)
    Player->>Server: POST /Items/{id}/PlaybackInfo
    Server-->>Player: { PlaySessionId, MediaSources }
    
    Player->>Telemetry: Initialize Session(PlaySessionId, MediaSourceId)
    Telemetry->>Server: POST /Sessions/Playing
    Note over Server: Dashboard shows "Playing: Inception"

    loop Active Playback (Every 10 Seconds)
        Telemetry->>Server: POST /Sessions/Playing/Progress (EventName: "TimeUpdate", PositionTicks)
    end

    User->>Player: Scrub Timeline (Dragging Slider)
    Note over Telemetry: Telemetry Suppressed During Drag
    User->>Player: Releases Scrub Handle
    Note over Telemetry: Debounce Timer (500ms) Expires
    Telemetry->>Server: POST /Sessions/Playing/Progress (EventName: "Seek", PositionTicks)

    User->>Player: Pauses Playback
    Telemetry->>Server: POST /Sessions/Playing/Progress (EventName: "Pause", IsPaused: true, PositionTicks)

    User->>Player: Closes Player / Navigates to Library
    Telemetry->>Server: POST /Sessions/Playing/Stopped (PositionTicks)
    Note over Server: UserData.PlaybackPositionTicks updated; Session Destroyed
```

### 5.1 Telemetry Endpoints & Payloads

#### 1. Playback Start
- **Endpoint:** `POST /Sessions/Playing`
- **Payload (`PlaybackStartDto`):**
  ```json
  {
    "ItemId": "item-guid-1",
    "MediaSourceId": "source-guid-1234",
    "AudioStreamIndex": 1,
    "SubtitleStreamIndex": 2,
    "PlaySessionId": "playsession-uuid-9876-5432-10fe",
    "PlayMethod": "DirectPlay",
    "PositionTicks": 24000000000,
    "CanSeek": true,
    "IsMuted": false,
    "VolumeLevel": 100
  }
  ```

#### 2. Playback Progress (Debounced)
- **Endpoint:** `POST /Sessions/Playing/Progress`
- **Interval:** Strict 10-second periodic timer + trailing 500ms seek debounce.
- **Payload (`PlaybackProgressDto`):**
  ```json
  {
    "ItemId": "item-guid-1",
    "MediaSourceId": "source-guid-1234",
    "AudioStreamIndex": 1,
    "SubtitleStreamIndex": 2,
    "PlaySessionId": "playsession-uuid-9876-5432-10fe",
    "PlayMethod": "DirectPlay",
    "PositionTicks": 25000000000,
    "IsPaused": false,
    "IsMuted": false,
    "VolumeLevel": 100,
    "EventName": "TimeUpdate"
  }
  ```

#### 3. Playback Stopped
- **Endpoint:** `POST /Sessions/Playing/Stopped`
- **Trigger:** Player unmount, navigation, or playback completion.
- **Payload (`PlaybackStopDto`):**
  ```json
  {
    "ItemId": "item-guid-1",
    "MediaSourceId": "source-guid-1234",
    "PlaySessionId": "playsession-uuid-9876-5432-10fe",
    "PositionTicks": 25000000000
  }
  ```

---

## 6. Playback Security, CORS, and Range Requests

1. **Authentication Token Isolation:**
   - Custom headers cannot be attached to `<video src>` or `<track src>` elements.
   - CineTheme uses `?api_key={accessToken}` on media URLs and strictly prevents printing media URLs containing tokens to application logs or console output.
2. **HTTP Range Requests:**
   - Direct Play requires `Accept-Ranges: bytes` and `206 Partial Content` support on the reverse proxy.
3. **CORS & Private Network Access (PNA):**
   - Transcoding and subtitle fetches require `Access-Control-Allow-Origin: *` or configured origin headers.

---

## 7. Version Compatibility Matrix (10.8 vs 10.9 vs 10.10+)

| Feature | Jellyfin 10.8.x | Jellyfin 10.9.x | Jellyfin 10.10+ | Compatibility Approach |
|---|---|---|---|---|
| **PlaybackInfo Endpoint** | `POST /Items/{id}/PlaybackInfo` | `POST /Items/{id}/PlaybackInfo` | `POST /Items/{id}/PlaybackInfo` | Universal API contract. |
| **fMP4 HLS Transcoding** | Experimental | Stable (`SegmentContainer=mp4`) | Stable (`SegmentContainer=mp4`) | Default to `ts` on 10.8, support `fmp4` on 10.9+. |
| **Trickplay Tile Manifest** | Absent | Supported (`/Trickplay/...`) | Supported (`/Trickplay/...`) | Probed; fallback to text tooltip if 404. |
| **Subtitle Extraction** | Supported | Supported | Supported | Direct stream extraction. |
