# CineTheme Windows Desktop Client — Tauri 2 Architecture

This document specifies the secondary Windows desktop architecture for CineTheme using Tauri 2.

---

## 1. Core Philosophy: Web-First Architecture

CineTheme is **web-first**. The web and PWA clients are the flagship product.

The Windows desktop client is a **secondary native shell** powered by Tauri 2 and Microsoft Edge WebView2.

### Critical Rule
- **No Rust Duplication**: All Jellyfin REST API communication, authentication, session tokens, media source selection, Hls.js streaming, and JASSUB Wasm subtitle rendering are executed directly by the web frontend.
- **Tauri Role**: Tauri provides native window chrome, OS lifecycle management, custom window bounds, native media keys, and deep-link protocol handlers.

```
┌─────────────────────────────────────────────────────────────┐
│                 CineTheme Windows Application               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             Tauri 2 Native Rust Shell               │   │
│   │  (Window Lifecycle, Deep Links, Media Session)      │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ IPC (Least-Privilege)        │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │             Microsoft Edge WebView2                 │   │
│   │  ┌───────────────────────────────────────────────┐  │   │
│   │  │   CineTheme Flagship Web Application          │  │   │
│   │  │   - React 19 + TypeScript 5                   │  │   │
│   │  │   - TanStack Query v5 + Zustand v5            │  │   │
│   │  │   - Hls.js Adaptive Video Engine              │  │   │
│   │  │   - JASSUB libass Wasm Engine                 │  │   │
│   │  │   - Anime Chapter & IntroSkipper Intelligence │  │   │
│   │  └───────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Window Management & Geometry

- **Default Resolution**: `1280x720` (16:9 cinematic baseline)
- **Minimum Bounds**: `1000x600` (ensures library navigation and sidebars fit without layout collapse)
- **State Persistence**: Window position and maximized states are managed by WebView2 window persistence without storing user tokens.
- **Fullscreen**: Native window fullscreen is orchestrated via [`DesktopAdapter.toggleFullscreen()`](file:///root/projects/CineTheme/src/platform/desktopAdapter.ts), harmonizing with standard HTML5 video fullscreen.

---

## 3. Codec & Media Capabilities in WebView2

Microsoft Edge WebView2 leverages Chromium's underlying media engine on Windows:

| Media Type / Codec | Support Status | Delivery Method |
| :--- | :--- | :--- |
| **H.264 (AVC)** | Hardware Accelerated | Direct Play / MP4 / MKV |
| **H.265 (HEVC)** | Supported (if OS HEVC extension present) | Direct Play / Remux / Transcode Fallback |
| **VP9 / AV1** | Native Support | Direct Play / WebM |
| **AAC / MP3 / FLAC** | Native Support | Direct Play |
| **HLS (fMP4 & MPEG-TS)** | Supported via Hls.js | Remux / Transcode |
| **ASS/SSA Subtitles** | WebAssembly via JASSUB | Direct Canvas Rendering |

---

## 4. Deep Link Foundation (`cinetheme://`)

CineTheme registers the `cinetheme://` custom protocol on Windows:
- `cinetheme://item/{id}`: Opens details view for media item.
- `cinetheme://player/{id}`: Launches video player for media item.
- `cinetheme://home`: Navigates to Home hub.

All deep links are strictly validated via regex (`/^[a-zA-Z0-9_-]+$/`) before navigation to prevent malicious URL injection or arbitrary code execution.
