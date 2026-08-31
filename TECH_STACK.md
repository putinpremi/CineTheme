# CineTheme Technology Stack & Evaluation Specification

## 1. Core Technology Decisions Matrix

| Domain | Selected Technology | Primary Alternatives | Justification Summary |
|---|---|---|---|
| **Core Framework** | React 19 + TypeScript 5 | Svelte 5, Vue 3, SolidJS | Ecosystem maturity for complex media players, WebAssembly integrations, accessibility primitives, and unified multi-platform shells. |
| **Build & Bundler** | Vite 6 | Webpack 5, Turbopack, Rollup | Sub-second HMR, native WebAssembly (`.wasm`) bundling for ASS subtitles, first-class Tauri & PWA plugin support. |
| **Styling & Design System** | Tailwind CSS v4 + Radix UI Primitives | Vanilla Extract, CSS Modules, MUI, Chakra | Zero-runtime CSS, fluid responsive design tokens, unstyled accessible UI primitives with keyboard/focus control. |
| **Server State & Caching** | TanStack Query v5 | SWR, RTK Query, Apollo | Industry-standard asynchronous state management, request deduplication, background revalidation, offline cache persistence. |
| **Client & Player State** | Zustand v5 + Immer | Redux Toolkit, MobX, Jotai | Minimal bundle footprint (<2kB), boilerplate-free, high-performance selector subscriptions essential for 60fps player HUD updates. |
| **Local Database / Metadata**| Dexie.js (IndexedDB Slim Projections) | LocalForage, SQLite (Wasm), WatermelonDB | High-performance indexed querying for 10,000+ library items using lightweight projections, avoiding Safari storage evictions. |
| **Video Engine** | Native HTML5 `<video>` + Hls.js | Video.js, Shaka Player, Dash.js | Low-level control over Media Source Extensions (MSE), Direct Play passthrough (MP4/WebM), seamless Direct Stream / transcode HLS fallback. |
| **Anime Subtitle Engine** | JASSUB (libass via WebAssembly) | SubtitlesOctopus, Canvas manual, Server Burn-in | Pixel-perfect SSA/ASS font/karaoke/positioning rendering client-side with bundled universal fallbacks and lazy attachment font fetching. |
| **Spatial Navigation (10-Foot)**| Single Declarative Focus Engine (DOM & `:focus-visible`) | Dual engines, `@noriginmedia/n-spatial-navigation` + custom store | Single unified focus manager avoiding competing listeners, supporting keyboard, D-pad, gamepad, and Android TV Leanback. |
| **Virtualization** | `@tanstack/react-virtual` | `react-window`, `react-virtualized` | Headless, ultra-lightweight, supports dynamic height and responsive multi-column media grids. |
| **Desktop Shell (Windows)** | Tauri v2 | Electron, Flutter Desktop, Neutralino | Native footprint (<40MB RAM vs 300MB+ for Electron), Rust-backed security, native OS window chrome and media keys. |
| **Mobile & TV Shell (Android)**| Capacitor v6 | React Native, Flutter, Native Kotlin | Reuses 100% of the flagship web application codebase with native Android TV input and hardware decoding bridges. |
| **Testing Suite** | Vitest + RTL + MSW + Playwright | Jest, Cypress, Cypress Component | ESM-native lightning test runner, authentic Jellyfin REST OpenAPI mocks, cross-browser automated E2E. |

---

## 2. In-Depth Evaluation per Major Decision

### 2.1 Core Framework: React 19 & TypeScript 5 (Strict)
- **Why Selected:** Standardized hooks model, broad support for media player primitives (Hls.js, JASSUB Wasm, spatial focus traps, TanStack Virtual). TypeScript 5 strict mode enforces complete type safety across Jellyfin DTOs and domain entities.
- **Alternatives Considered:** Svelte 5, Vue 3. (Rejected due to smaller specialized multimedia and WebAssembly canvas tooling ecosystem).
- **Advantages:** Rich headless UI ecosystem (Radix UI), predictable profiling, shared code across Web, Tauri, and Capacitor.
- **Disadvantages:** Baseline virtual DOM footprint; requires disciplined memoization and state slicing for high-frequency player events.
- **Risks:** Uncontrolled re-renders during playback. *Mitigation:* Decouple high-frequency playback progress into isolated Zustand selector slices and direct DOM/ref loops.
- **Platform Implications:** Uniform runtime across Web (Chrome, Safari, Firefox), Windows (Tauri WebView2), and Android (Capacitor WebView).

### 2.2 Video Engine: HTML5 `<video>` + Hls.js
- **Why Selected:** HTML5 `<video>` is the foundational browser media element with hardware-accelerated decoding. Hls.js provides MSE-based HTTP Live Streaming for Jellyfin's Direct Stream and transcode master playlists (`/Videos/{itemId}/master.m3u8`).
- **Codec & Container Compatibility Strategy:**
  - **Direct Play (`static=true`):** Used **ONLY** when the browser natively supports both the container (MP4, WebM) and the codecs (H.264/AV1/VP9 + AAC/Opus/FLAC).
  - **Direct Stream (Remuxing via HLS):** Used for MKV containers and unsupported audio codecs (DTS, TrueHD, AC3). Jellyfin copies the video track (0% CPU) and remuxes/transcodes only the container or audio into HLS segments.
  - **Transcoding:** Used strictly when the video codec or resolution is unsupported, or when bandwidth constraints require a lower bitrate.
- **Platform Implications:** Zero-crash streaming across all browsers without making false assumptions about MKV container support.

### 2.3 Anime Subtitles: JASSUB (libass WebAssembly)
- **Why Selected:** Enables client-side rendering of complex `.ass`/`.ssa` subtitles with custom fonts, karaoke effects, and positioning, bypassing server-side video transcoding.
- **Font Strategy:**
  - Bundles universal fallback fonts (Arial, Open Sans, Gandhi Sans, Noto Sans) with the client.
  - Treats embedded fonts as attachments (`/Videos/{itemId}/{mediaSourceId}/Attachments/{index}`).
  - Downloads only primary dialogue fonts lazily/on-demand in the background, never blocking initial playback startup.
- **Platform Implications:** Operates in a dedicated Web Worker with `OffscreenCanvas` where available, falling back gracefully to main-thread canvas when required (e.g. older WebViews).

### 2.4 Spatial Navigation: Single Unified Declarative Engine
- **Why Selected:** Eliminates competing focus managers and state desynchronization. Maps directional inputs (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Back`, Gamepad D-pad) directly to standard DOM focus and CSS `:focus-visible`.
- **Modal & Player Focus Traps:** Predictable focus traps ensure remote control focus never escapes modal dialogs, search inputs, or player HUD controls.
- **Platform Implications:** Guarantees 10-foot TV parity on Android TV, Gamepads, and Desktop keyboard navigation.

### 2.5 Storage & Caching: Dexie.js (Slim Normalized Projections)
- **Why Selected:** Storing lightweight normalized projections (ID, title, sortName, year, imageTag, type, resumePositionTicks, watched status) in IndexedDB provides instant offline startup and fast filtering across 10,000+ items without consuming excessive storage quotas or triggering Safari 7-day eviction.
- **Platform Implications:** Fully compatible with Web, PWA, Tauri, and Android WebView storage models.
