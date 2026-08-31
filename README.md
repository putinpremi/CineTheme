# CineTheme

CineTheme is a production-grade, web-first Jellyfin media streaming client engineered for modern web browsers, with secondary packaging for Windows Desktop (Tauri v2), Android Mobile (Capacitor v8), and Android TV (Capacitor v8).

---

## Architecture & Specifications

The project architecture is defined in the following foundational documents:

- [ARCHITECTURE_BASELINE.md](file:///root/projects/CineTheme/ARCHITECTURE_BASELINE.md) — Authoritative architecture baseline and system contracts.
- [TV_ARCHITECTURE.md](file:///root/projects/CineTheme/TV_ARCHITECTURE.md) — Android TV 10-foot experience, D-pad spatial navigation, focus management, and Leanback launcher integration.
- [ANDROID_ARCHITECTURE.md](file:///root/projects/CineTheme/ANDROID_ARCHITECTURE.md) — Android mobile client (Capacitor 8), hardware back handling, status bar, and deep links.
- [ANDROID_SECURITY.md](file:///root/projects/CineTheme/ANDROID_SECURITY.md) — Android least-privilege permissions, cleartext traffic policy, and secure storage isolation.
- [ANDROID_BUILD.md](file:///root/projects/CineTheme/ANDROID_BUILD.md) — Android APK/AAB build instructions, Gradle targets, and Google Play Store readiness.
- [WINDOWS_ARCHITECTURE.md](file:///root/projects/CineTheme/WINDOWS_ARCHITECTURE.md) — Windows desktop client (Tauri 2), WebView2 pipeline, window geometry, and deep links.
- [TAURI_SECURITY.md](file:///root/projects/CineTheme/TAURI_SECURITY.md) — Tauri 2 capability model, least-privilege permissions, CSP, and external URL gates.
- [WINDOWS_BUILD.md](file:///root/projects/CineTheme/WINDOWS_BUILD.md) — Windows x64 build prerequisites, NSIS/MSI packaging, and code signing.
- [PWA_ARCHITECTURE.md](file:///root/projects/CineTheme/PWA_ARCHITECTURE.md) — PWA manifest, service worker caching tiers, offline app shell, and update flow.
- [SECURITY.md](file:///root/projects/CineTheme/SECURITY.md) — Security posture, session lifecycle, CacheStorage rules, XSS mitigation, and CSP deployment headers.
- [API_VERIFICATION.md](file:///root/projects/CineTheme/API_VERIFICATION.md) — Verified Jellyfin REST API contracts, headers, and endpoints.
- [ANIME_INTELLIGENCE.md](file:///root/projects/CineTheme/ANIME_INTELLIGENCE.md) — Anime playback intelligence, chapter parsing, IntroSkipper probing, trickplay scrubbing, and episode navigation.
- [SUBTITLE_FONT_ARCHITECTURE.md](file:///root/projects/CineTheme/SUBTITLE_FONT_ARCHITECTURE.md) — Subtitle font attachment discovery, memory caching, and JASSUB Wasm integration.
- [ARCHITECTURE.md](file:///root/projects/CineTheme/ARCHITECTURE.md) — System architecture, layering, security model, and performance boundaries.
- [TECH_STACK.md](file:///root/projects/CineTheme/TECH_STACK.md) — Technology evaluation matrix, pros, cons, and platform implications.
- [API_ARCHITECTURE.md](file:///root/projects/CineTheme/API_ARCHITECTURE.md) — Jellyfin REST API contracts, authentication flows, and server capability matrices.
- [PLAYER_ARCHITECTURE.md](file:///root/projects/CineTheme/PLAYER_ARCHITECTURE.md) — Playback negotiation, Hls.js fallback, JASSUB Wasm subtitle engine, and debounced telemetry.
- [STATE_ARCHITECTURE.md](file:///root/projects/CineTheme/STATE_ARCHITECTURE.md) — Server state (TanStack Query v5), client state (Zustand v5), and cross-tab sync.
- [CACHING_ARCHITECTURE.md](file:///root/projects/CineTheme/CACHING_ARCHITECTURE.md) — Multi-tier caching, Dexie.js slim IndexedDB schema, and Service Worker rules.
- [PLATFORM_ARCHITECTURE.md](file:///root/projects/CineTheme/PLATFORM_ARCHITECTURE.md) — Web/PWA networking, Tauri, Capacitor, and 10-foot spatial navigation.
- [TESTING_STRATEGY.md](file:///root/projects/CineTheme/TESTING_STRATEGY.md) — Quality gates, Vitest unit testing, MSW API mocking, and Playwright E2E.
- [ROADMAP.md](file:///root/projects/CineTheme/ROADMAP.md) — Phased milestone execution plan and out-of-scope boundaries.

---

## Development Requirements

- **Node.js:** `>= 20.0.0` (LTS or current)
- **Package Manager:** `npm` or `pnpm`
- **Jellyfin Server:** Version `10.8.x`, `10.9.x`, or `10.10+`
- **(Optional for Windows Desktop Build):** Rust `>= 1.80.0`, Microsoft Edge WebView2, Visual Studio C++ Build Tools
- **(Optional for Android Mobile Build):** OpenJDK 21, Android SDK (API 34/35)

---

## Development & Verification Commands

```bash
# Start local development server (with HMR)
npm run dev

# Run full quality verification gate (Typecheck + Lint + Vitest + Build)
npm run verify

# Run Playwright Browser E2E suite
npm run test:e2e

# Run unit and component test suite
npm test

# Sync web assets to Android
npx cap sync android

# Run tests in watch mode
npm run test:watch

# Run TypeScript type check
npm run typecheck

# Run ESLint analysis
npm run lint

# Production web build
npm run build
```

---

## Manual Testing with a Real Jellyfin Server

To test CineTheme against a real Jellyfin server:

1. **Start Development Server:** Run `npm run dev` and open `http://localhost:5173`.
2. **Server Address:**
   - For local servers on your LAN: Enter `http://192.168.x.x:8096` or `http://localhost:8096`.
   - For remote servers: Enter your HTTPS domain (e.g. `https://jellyfin.yourdomain.com` or Tailscale HTTPS).
3. **Credentials:** Enter your Jellyfin username and password.
4. **Sign In:** Click **Sign In**.
   - CineTheme probes public system information (`GET /System/Info/Public`).
   - Authenticates via `POST /Users/AuthenticateByName`.
   - Transitions to the authenticated session state and redirects to `/home`.
   - **Password Security:** The user password is not persisted, not stored in global application state after authentication, not logged, and never written to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
5. **Media Library Browsing:**
   - **Home Hub (`/home`):** View real *Continue Watching / Resume* media, *Recently Added* items, and quick links to your Jellyfin libraries.
   - **Libraries View (`/library`):** Browse top-level media views (Movies, TV Shows, Anime). Click any library to inspect media items with server-side pagination (`Previous` / `Next` page controls).
   - **Item Details (`/item/:itemId`):** Click any media poster to open the cinematic details view displaying metadata, backdrop art, community rating, runtime, overview, genres, and cast & crew.
6. **Advanced Search & Filtering (`/search`):**
   - Type queries in the full-width search input with real-time 350ms debouncing.
   - Filter by media type (All, Movies, TV Shows, Seasons, Episodes).
   - Filter by genre using server-scoped genres list.
   - Sort by Name (A-Z / Z-A), Highest Rated, Recently Added, or Release Date.
   - Toggle Quick Filters for Favorites and Unwatched items.
   - URL synchronization keeps `/search?q=...&type=...&genre=...&page=...` shareable and browser-back compatible without leaking tokens or passwords.
7. **Cinematic Video Player & Anime Intelligence (`/player/:itemId`):**
   - Direct Play and HLS adaptive streaming.
   - ASS/SSA typography rendering via JASSUB WebAssembly worker with embedded font discovery.
   - **Skip Intro / Outro:** Floating accessible button that dynamically detects chapter markers and IntroSkipper plugin cues.
   - **Trickplay Thumbnails:** Interactive timeline hovering with sprite sheet coordinates on supported servers.
   - **Episode Navigation & Auto-Next:** Seamless episode advance with a 10-second countdown overlay and audio/subtitle language preference matching.
8. **Progressive Web App (PWA) & Offline Shell:**
   - Install CineTheme as a standalone desktop or mobile application directly from supported browsers or Settings.
   - Offline application shell caches UI assets while strictly protecting authenticated media data.
   - Non-intrusive update system notifies users of new client releases without interrupting active playback.
9. **Windows Desktop Client (Tauri 2):**
   - Packaged with native window chrome, deep linking (`cinetheme://`), least-privilege security capabilities, and hardware-accelerated WebView2 playback.
10. **Android Mobile Client (Capacitor 8):**
    - Native Android hardware back-button LIFO chain, translucent status bar, custom scheme deep linking (`cinetheme://`), and token-safe share sheet.
11. **Android TV Client (Capacitor 8) — Implemented & Statically Verified:**
    - 10-foot TV presentation layer with enlarged typography and cards, high-contrast D-pad focus indicators, 2D Euclidean spatial navigation, overscan safe-area protection, and Leanback launcher banner integration (Physical hardware runtime verification: *Pending / Not Available*).
12. **Sign Out:** Return to `/login` or click the session button in the header to invalidate the session and flush all cached media data.
