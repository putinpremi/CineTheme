# CineTheme Playback Test Matrix Specification

This document defines the comprehensive playback verification test matrix for CineTheme. All tests are designed to execute against MSW-mocked Jellyfin playback and stream endpoints in Vitest and React Testing Library without requiring live media files or an active transcoding server.

---

## 1. Automated Test Matrix

| ID | Test Scenario | Input Media & Codec Profile | Expected Playback Mode | Expected Stream URL & Parameters | Verification Assertions |
|---|---|---|---|---|---|
| **TP-01** | **Direct Play MP4** | Container: `mp4`<br>Video: `h264`<br>Audio: `aac` | `DIRECT_PLAY` | `/Videos/{id}/stream.mp4?static=true` | - `HTMLMediaElement.src` matches static stream URL.<br>- `PlayMethod: DirectPlay` sent to `/Sessions/Playing`.<br>- Zero transcode overhead. |
| **TP-02** | **Direct Play WebM** | Container: `webm`<br>Video: `vp9`<br>Audio: `opus` | `DIRECT_PLAY` | `/Videos/{id}/stream.webm?static=true` | - Direct Play selected for native WebM.<br>- Telemetry dispatches `DirectPlay`. |
| **TP-03** | **Remux MKV (H.264 + AAC)** | Container: `mkv`<br>Video: `h264`<br>Audio: `aac` | `REMUX` (Direct Stream) | `/Videos/{id}/master.m3u8` | - TranscodingUrl requested with HLS.<br>- `VideoCodec=copy`, `AudioCodec=copy`.<br>- Hls.js attached on Chromium/Firefox; native on Safari. |
| **TP-04** | **Direct Stream (HEVC + DTS)** | Container: `mkv`<br>Video: `hevc`<br>Audio: `dts` | `DIRECT_STREAM` | `/Videos/{id}/master.m3u8` | - Video codec copied if hardware supports HEVC.<br>- Audio transcoded to AAC (`AudioCodec=aac`). |
| **TP-05** | **Full Video Transcode** | Container: `mkv`<br>Video: `mpeg2video`<br>Audio: `ac3` | `TRANSCODE` | `/Videos/{id}/master.m3u8` | - `VideoCodec=h264`, `AudioCodec=aac`.<br>- Server-side transcoding initiated. |
| **TP-06** | **External WebVTT Subtitles** | Format: `vtt`<br>Delivery: `External` | `DIRECT_PLAY` / `REMUX` | Subtitle URL: `/Subtitles/{idx}/Stream.vtt` | - HTML5 `<track>` element rendered or custom WebVTT cue parser active.<br>- Subtitle text visible on screen. |
| **TP-07** | **Embedded ASS / SSA Subtitles** | Format: `ass`<br>Delivery: `External` | Any Mode | Subtitle URL: `/Subtitles/{idx}/Stream.ass` | - `JASSUB` WebAssembly canvas overlay initialized.<br>- Fallback fonts loaded immediately.<br>- Font attachments queried asynchronously. |
| **TP-08** | **PGS Bitmap Subtitles** | Format: `pgssub`<br>Delivery: `Encode` | `TRANSCODE` | `SubtitleStreamIndex={idx}` in TranscodingUrl | - DeviceProfile marks PGS as `Encode`.<br>- Server burns subtitles into video stream. |
| **TP-09** | **Audio Track Switching** | Item with 2 Audio Tracks (English, Japanese) | Switch Track | Re-negotiate `AudioStreamIndex` | - User selects Japanese audio.<br>- Player state updates `activeAudioIndex`.<br>- New stream URL or Hls.js track switch dispatched. |
| **TP-10** | **Subtitle Track Switching** | Item with English, Spanish, Off | Switch / Off | Switch Subtitle Stream Index | - Selecting Off destroys JASSUB canvas or hides `<track>`.<br>- Selecting Spanish loads Spanish VTT/ASS. |
| **TP-11** | **Resume Playback** | `UserData.PlaybackPositionTicks = 24000000000` (2400s) | Prompt / Auto Resume | `StartTimeTicks=24000000000` | - Player offers Resume from 40:00 vs Start from Beginning.<br>- Seeking directly to 2400s on initialization. |
| **TP-12** | **Debounced Scrub Telemetry** | Rapid user timeline dragging | Scrubbing | No telemetry during drag; 500ms trailing seek dispatch | - 10 seek scrubber events fired in 200ms.<br>- Exactly 1 POST to `/Sessions/Playing/Progress` after 500ms debounce. |
| **TP-13** | **Periodic Telemetry Heartbeat** | Active playing state | Normal Playback | POST every 10,000ms | - Timer fires every 10 seconds.<br>- `PositionTicks` advances correctly. |
| **TP-14** | **Pause & Stop Reporting** | User pauses or closes player | Pause / Unmount | Immediate POST to `/Progress` and `/Stopped` | - Pausing sends `IsPaused: true`.<br>- Unmounting sends `/Sessions/Playing/Stopped`. |
| **TP-15** | **Transient Network Loss Recovery** | Network stall / 504 Gateway Timeout | `RECOVERING` | Exponential backoff retry | - Stream stalls.<br>- Player enters `RECOVERING` state.<br>- Retries up to 3 times before displaying error HUD. |
| **TP-16** | **Fatal Transcode Failure** | FFmpeg 500 Internal Error | `ERROR` | Actionable error UI | - Error message: "Playback error: Transcoding failed on server".<br>- Retry button displayed. |
| **TP-17** | **Session 401 Expiration** | Token revoked while playing | `STOPPED` | Session Invalidation | - 401 response on progress heartbeat.<br>- Player tears down immediately, purges session, and redirects to `/login`. |
| **TP-18** | **Bitrate Quality Capping** | User selects 720p 4Mbps | `TRANSCODE` | `MaxStreamingBitrate=4000000` | - Re-negotiates `PlaybackInfo` with new bitrate cap.<br>- Seamlessly reloads video at current timestamp. |
| **TP-19** | **Audio & Subtitle Delay Sync** | User sets Audio +150ms, Subtitle -200ms | Local Calibration | Dynamic offset | - Audio delay applied to Web Audio API.<br>- Subtitle delay applied to JASSUB/WebVTT cue timing. |
| **TP-20** | **Keyboard Navigation** | Space (Play/Pause), Left/Right (Seek), Up/Down (Volume), F (Fullscreen), M (Mute) | Hotkey Actions | UI & Player updates | - Accessible keyboard listeners respond with standard shortcuts. |

---

## 2. Testing Framework Architecture
- **Mocking Tool:** Mock Service Worker (MSW v2) intercepting `POST /Items/{id}/PlaybackInfo`, `POST /Sessions/Playing*`, and media stream routes.
- **HTML5 Media Mocking:** `vitest-canvas-mock` and custom mock for `HTMLMediaElement` (`play`, `pause`, `canPlayType`, `currentTime`, `duration`, `buffered`).
- **Assertion Standards:** Verify exact payload structures, timing debounces, query parameters, state transitions, and memory cleanup.
