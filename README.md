# CineTheme

CineTheme is a production-grade, web-first Jellyfin media streaming client engineered for modern web browsers, with secondary packaging for Windows Desktop (Tauri v2), Android Mobile (Capacitor v8), and Android TV (Capacitor v8).

---

## Key Features

- **Flagship Web & PWA:** Pure React 19 + TypeScript single-page application, responsive layout across mobile, tablet, and desktop viewports, installable PWA with offline App Shell.
- **Cinematic Video Player:** HLS adaptive bitrate streaming (Hls.js) with fallback negotiation, Direct Play, JASSUB WebAssembly ASS/SSA subtitle rendering with embedded font extraction, and chapter marker navigation.
- **Anime Intelligence:** Automatic intro & outro detection (chapter heuristics and IntroSkipper plugin integration), auto-next episode countdown overlay, and language preference matching.
- **Multiplatform Packaging:**
  - **Windows Desktop:** Tauri 2 native shell with least-privilege capability model, WebView2 hardware acceleration, and `cinetheme://` deep link support.
  - **Android Mobile:** Capacitor 8 native shell with hardware back-button LIFO chain, translucent status bar, and safe-area insets.
  - **Android TV:** 10-foot TV UI with 2D Euclidean spatial navigation, D-pad focus indicators, and overscan protection.
- **Zero-Trust Security:** Access tokens are memory-scoped per server/user; credentials and passwords are never logged or stored in persistent browser storage.

---

## Documentation

- [RELEASE_GUIDE.md](file:///root/projects/CineTheme/RELEASE_GUIDE.md) — Production release packaging, signing preparation, and deployment guide for Web, Android, and Windows.
- [SECURITY.md](file:///root/projects/CineTheme/SECURITY.md) — Security posture, session lifecycle, CacheStorage rules, XSS mitigation, and recommended HTTP headers.

---

## Development Prerequisites

- **Node.js:** `>= 20.0.0` (LTS or current)
- **Package Manager:** `npm`
- **Jellyfin Server:** Version `10.8.x`, `10.9.x`, or `10.10+`
- **(Optional for Android Builds):** OpenJDK 21, Android SDK (API 34/36)
- **(Optional for Windows Desktop Builds):** Rust `>= 1.80.0`, Microsoft Edge WebView2, Visual Studio C++ Build Tools

---

## Development & Verification Commands

```bash
# Start local development server (with HMR)
npm run dev

# Run full quality verification gate (Typecheck + Lint + Vitest + Build)
npm run verify

# Run unit and component test suite
npm test

# Run Playwright Browser E2E suite
npm run test:e2e

# Run TypeScript type check
npm run typecheck

# Run ESLint analysis
npm run lint

# Production web build
npm run build

# Sync web assets to Android
npx cap sync android
```

---

## Manual Testing with a Real Jellyfin Server

1. **Start Development Server:** Run `npm run dev` and open `http://localhost:5173`.
2. **Server Address:**
   - LAN servers: `http://192.168.x.x:8096` or `http://localhost:8096`.
   - Remote servers: Your HTTPS domain (e.g. `https://jellyfin.yourdomain.com`).
3. **Credentials:** Enter your Jellyfin username and password.
4. **Sign In:**
   - CineTheme probes public system information (`GET /System/Info/Public`).
   - Authenticates via `POST /Users/AuthenticateByName`.
   - Transitions to the authenticated session state and redirects to `/home`.
   - *Password Security:* User passwords are not persisted in storage, state, or logs.
5. **Media Library Browsing:**
   - **Home Hub (`/home`):** Real *Continue Watching / Resume* media, *Recently Added* items, and quick links to libraries.
   - **Libraries View (`/library`):** Browse top-level media views with server-side pagination.
   - **Item Details (`/item/:itemId`):** Cinematic details view with metadata, backdrop art, community rating, runtime, overview, genres, and cast & crew.
6. **Advanced Search & Filtering (`/search`):**
   - 350ms debounced search query input.
   - Filter by media type, genre, and sort criteria.
7. **Cinematic Video Player & Subtitles (`/player/:itemId`):**
   - Direct Play and HLS adaptive streaming.
   - ASS/SSA typography rendering via JASSUB WebAssembly worker.
   - Intro/outro skipping and episode auto-advance.
8. **Sign Out:** Return to `/login` or use the header session menu to invalidate the session token and flush all cached media data.
