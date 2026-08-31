# CineTheme Android Mobile Client — Capacitor 8 Architecture

This document specifies the secondary Android mobile architecture for CineTheme using Capacitor 8.

---

## 1. Core Philosophy: Web-First Architecture

CineTheme is **web-first**. The existing React 19 + TypeScript web application remains the authoritative source of truth.

The Android mobile client is a **secondary native shell** powered by Capacitor 8 and Android System WebView (Chromium-based).

### Critical Rule
- **No Kotlin Duplication**: All Jellyfin REST API communication, authentication, session tokens, media source selection, Hls.js streaming, JASSUB Wasm subtitle rendering, and anime intelligence are executed directly in the React frontend.
- **Capacitor Role**: Capacitor provides native Android hardware back-button interception, status bar styling, safe-area inset adaptation, deep link handling, and app lifecycle state sync.

```
┌─────────────────────────────────────────────────────────────┐
│                 CineTheme Android Mobile App                │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             Capacitor 8 Native Shell                │   │
│   │  (Hardware Back, Status Bar, App Lifecycle, Intent) │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ Bridge (Least-Privilege)     │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │              Android System WebView                 │   │
│   │  ┌───────────────────────────────────────────────┐  │   │
│   │  │   CineTheme Flagship Web Application          │  │   │
│   │  │   - React 19 + TypeScript 5                   │  │   │
│   │  │   - TanStack Query v5 + Zustand v5            │  │   │
│   │  │   - Hls.js Adaptive Video Streaming           │  │   │
│   │  │   - JASSUB libass Wasm Engine                 │  │   │
│   │  │   - Anime Chapter & IntroSkipper Intelligence │  │   │
│   │  │   - Mobile Touch & Safe-Area Padding          │  │   │
│   │  └───────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Hardware Back Button Handling

Implemented in [`MobileAdapter.registerBackButtonHandler()`](file:///root/projects/CineTheme/src/platform/mobileAdapter.ts):

The Android hardware back button (and back gesture) follows a strict **LIFO priority chain**:
1. **Modal / Menu Dismissal**: Closes any open dropdown, dialog, or drawer.
2. **Player Fullscreen**: Exits video fullscreen.
3. **Player Exit**: Closes active video player and returns to previous view.
4. **Router Back**: Calls `window.history.back()`.
5. **App Exit**: Only calls `App.exitApp()` if at root view with no history.

---

## 3. Status Bar & Immersive Edge-to-Edge

- **Normal Views**: Dark status bar with light icons matching CineTheme's `#0a0a0f` background.
- **Player View**: Status bar overlays webview for a seamless cinematic experience.
- **Safe Area Insets**: Layout headers and HUD controls respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.

---

## 4. Deep Linking (`cinetheme://`) & App Links

- **Custom Scheme**: Registered via `<data android:scheme="cinetheme" />` in `AndroidManifest.xml`.
- **Supported Routes**:
  - `cinetheme://item/{id}` -> Media details view.
  - `cinetheme://player/{id}` -> Video playback view.
  - `cinetheme://home` -> Home view.
  - `cinetheme://search` -> Search view.
- **App Links Status**: Prepared for verified `https://` App Links when `/.well-known/assetlinks.json` is deployed on the production domain.
