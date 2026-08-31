# CineTheme Security Architecture & Deployment Guidelines

This document details the security posture, authentication lifecycle, storage rules, XSS mitigations, and recommended production HTTP headers for CineTheme.

---

## 1. Authentication & Session Lifecycle

1. **Session Token Model**:
   - Jellyfin `AccessToken` is treated strictly as an active session token.
   - Plaintext passwords are **NEVER** stored anywhere in `localStorage`, `sessionStorage`, IndexedDB, cookies, or Service Worker cache.
2. **Immediate Invalidation on 401**:
   - Any `401 Unauthorized` response from the server immediately invalidates the active session and redirects to `/login`.
   - Silent background re-authentication loops and credential reuse are strictly prohibited.
3. **Multi-Server & Multi-User Isolation**:
   - All state in Zustand and React Query cache is scoped by `serverId + userId`.
   - Switching servers completely flushes active session tokens and in-memory caches.

---

## 2. Storage & Cache Storage Security

- **Service Worker `CacheStorage`**:
  - Exclusively caches static application shell bundles (`/index.html`, `/assets/*.js`, `/assets/*.css`, fonts, icons).
  - **Never** caches authenticated API endpoints (`/Users/`, `/Items/`, `/Shows/`, `/Videos/`, `/Sessions/`).
  - **Never** caches queries with `api_key` or `token`.
- **`localStorage`**:
  - Limited to non-sensitive preferences (`preferredAudioLanguage`, `preferredSubtitleLanguage`, `autoPlayNextEpisode`) and the active session struct (`{ accessToken, serverUrl, serverId, user }`).

---

## 3. XSS & Untrusted Metadata Handling

- All media titles, overviews, season names, artist names, and chapter strings received from Jellyfin are treated as untrusted user input.
- React JSX automatic text escaping is used across all UI elements.
- **Zero usage** of `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `Function()` constructors across the entire codebase.

---

## 4. Production Security Headers

When deploying CineTheme (e.g. via Nginx, Caddy, Cloudflare, or Vercel), configure the following headers:

### Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: http: https:; media-src 'self' blob: http: https:; connect-src 'self' blob: http: https: ws: wss:; worker-src 'self' blob:; object-src 'none'; frame-ancestors 'none';
```

> [!NOTE]
> - `wasm-unsafe-eval` is required for JASSUB / libass WebAssembly subtitle compilation.
> - `img-src`, `media-src`, and `connect-src` permit `http:` and `https:` to allow connecting to user-specified remote or local Jellyfin server instances.
> - `worker-src 'self' blob:` allows JASSUB and HLS worker threads.

### Standard Defensive Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

---

## 5. Logging & Redaction Rules

- `HttpClient` and `PlayerController` automatically redact `Token`, `api_key`, and user passwords before emitting any debug messages.
- Production builds strip verbose telemetry logs.
