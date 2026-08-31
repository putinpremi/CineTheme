# CineTheme PWA & Offline Architecture

This document defines the Progressive Web App (PWA) architecture, Service Worker caching policies, install experience, and offline resilience in CineTheme.

---

## 1. Overview & Principles

CineTheme is a **web-first Jellyfin client**. The web client is the flagship product across desktop, tablet, and mobile browsers.

Key architectural tenets:
1. **App Shell Availability**: The core application shell (HTML, CSS, JS, fonts, icons) is precached and available offline.
2. **Strict Cache Isolation for Authenticated Data**: Service Worker `Cache Storage` **NEVER** stores passwords, access tokens, `Authorization` headers, or authenticated Jellyfin API responses.
3. **Zero Media Stream Caching in SW**: Video streams, HLS manifests, TS/m4s media segments, subtitle streams, and trickplay sprite sheets are explicitly bypassed and never cached by the Service Worker.
4. **Non-Intrusive Updates**: New Service Worker versions activate via user consent, and updates are **NEVER** forced or reloaded during active video playback.

---

## 2. Web App Manifest

The Web App Manifest is located at `/manifest.webmanifest` and registered in `/index.html`.

### Properties:
- **`name`**: `CineTheme`
- **`short_name`**: `CineTheme`
- **`description`**: Production-grade, web-first Jellyfin media client.
- **`start_url`**: `/`
- **`scope`**: `/`
- **`display`**: `standalone`
- **`orientation`**: `any`
- **`theme_color`**: `#0a0a0f`
- **`background_color`**: `#0a0a0f`
- **`icons`**:
  - `192x192` SVG icon (`purpose: "any"`)
  - `512x512` SVG icon (`purpose: "any"`)
  - `512x512` SVG maskable icon (`purpose: "maskable"`)

---

## 3. Cache Tier Taxonomy

| Cache Tier | Storage Layer | Contents | Strategy |
| :--- | :--- | :--- | :--- |
| **`APP_SHELL`** | Service Worker `CacheStorage` | `/index.html`, `/manifest.webmanifest`, `/icons/*` | Cache-first with precaching |
| **`STATIC_ASSETS`** | Service Worker `CacheStorage` | Bundled JS (`/assets/*.js`), CSS (`/assets/*.css`), fonts, Wasm | Cache-first with network fallback |
| **`AUTHENTICATED_API`** | Memory (`TanStack Query`) | Jellyfin user libraries, metadata, search results | Stale-While-Revalidate in memory; **Bypasses SW CacheStorage** |
| **`MEDIA_STREAMS`** | Browser Buffer / HLS.js Memory | HLS manifests (`.m3u8`), media chunks (`.ts`, `.m4s`), MP4/MKV streams | Network-only; **SW Cache strictly prohibited** |

---

## 4. Service Worker Fetch Interception (`sw.js`)

The Service Worker inspects every incoming request using strict exclusion filters:

```javascript
// Rule 1: Only handle GET requests
if (request.method !== 'GET') return;

// Rule 2: NEVER cache Jellyfin authenticated APIs or media streaming endpoints
const isJellyfinEndpoint =
  url.pathname.includes('/Users/') ||
  url.pathname.includes('/Items/') ||
  url.pathname.includes('/Shows/') ||
  url.pathname.includes('/Videos/') ||
  url.pathname.includes('/Sessions/') ||
  url.pathname.includes('/System/') ||
  url.pathname.includes('/Plugin/') ||
  url.pathname.includes('/Episode/');

const isMediaStream =
  url.pathname.endsWith('.m3u8') ||
  url.pathname.endsWith('.ts') ||
  url.pathname.endsWith('.m4s') ||
  url.pathname.endsWith('.mp4') ||
  url.pathname.endsWith('.webm') ||
  url.pathname.endsWith('.mkv') ||
  url.pathname.endsWith('.vtt') ||
  url.pathname.endsWith('.ass') ||
  url.pathname.endsWith('.srt');

const hasAuthQuery =
  url.searchParams.has('api_key') ||
  url.searchParams.has('token') ||
  url.searchParams.has('Token');

if (isJellyfinEndpoint || isMediaStream || hasAuthQuery) {
  // Explicit direct bypass - do not touch cache
  return;
}

// Rule 3: HTML Navigation Requests (Network-first with cached App Shell fallback)
if (request.mode === 'navigate') {
  event.respondWith(
    fetch(request).catch(() => caches.match('/index.html'))
  );
  return;
}

// Rule 4: Static Web App Assets (Cache-first with Network Fallback)
if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
}
```

---

## 5. Offline Shell & Network Status

When offline:
1. Navigation requests return the cached `/index.html` shell.
2. The React SPA boots and [`useNetworkStatus`](file:///root/projects/CineTheme/src/pwa/useNetworkStatus.ts) reflects `isOnline === false`.
3. The UI renders the non-intrusive [`OfflineBanner`](file:///root/projects/CineTheme/src/components/pwa/OfflineBanner.tsx) indicating cached shell operation.
4. TanStack Query prevents unnecessary network spam when `isOnline === false`.
5. CineTheme clearly distinguishes between:
   - **Browser Offline**: Client device has no active internet/LAN connection.
   - **Jellyfin Server Unreachable**: Device is online, but the target Jellyfin host is down or blocked by CORS / Mixed Content.
   - **Session Expired (401)**: User token is revoked, prompting the server login view.

---

## 6. Update Lifecycle & Playback Protection

1. When a new version is deployed, the Service Worker downloads assets in the background.
2. Once installed, a custom event `cinetheme-pwa-update` is dispatched.
3. [`usePwaUpdate`](file:///root/projects/CineTheme/src/pwa/usePwaUpdate.ts) displays [`PwaUpdateToast`](file:///root/projects/CineTheme/src/components/pwa/PwaUpdateToast.tsx) with **[ Update Now ]** and **[ Later ]** options.
4. **Playback Lock**: If `playerState === 'PLAYING'`, the update toast is suppressed to protect active media consumption.
5. On user approval, `postMessage({ type: 'SKIP_WAITING' })` triggers `self.skipWaiting()` and cleanly reloads the application.

---

## 7. Install Experience

- [`usePwaInstall`](file:///root/projects/CineTheme/src/pwa/usePwaInstall.ts) intercepts `beforeinstallprompt` without popping intrusive auto-modals.
- Exposes user-initiated install buttons in **Settings** and the **Sidebar**.
- Automatically hides install triggers once installed in standalone mode.
