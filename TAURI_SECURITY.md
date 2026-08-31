# CineTheme Tauri 2 Security Posture & Capability Model

This document details the security architecture, permission boundaries, and isolation guarantees for the CineTheme Windows client built with Tauri 2.

---

## 1. Principle of Least Privilege

CineTheme's Tauri configuration (`src-tauri/capabilities/default.json`) adheres to strict least-privilege standards:

### Granted Permissions:
- `core:default`: Basic webview initialization.
- `core:window:allow-minimize`: Window minimize button.
- `core:window:allow-toggle-maximize`: Window maximize/restore.
- `core:window:allow-close`: Window close button.
- `core:window:allow-set-fullscreen`: Fullscreen toggling.
- `core:window:allow-is-fullscreen`: Fullscreen state queries.
- `core:app:allow-version`: Reading application version.

### Explicitly Prohibited Permissions:
- **No Filesystem Access**: `fs:*` is disabled.
- **No Shell Execution**: `shell:*` (child process spawning, arbitrary command execution) is disabled.
- **No Direct Process Access**: `process:*` is disabled.
- **No Clipboard Access**: Native clipboard permissions are omitted; standard web Clipboard API is used.

---

## 2. Content Security Policy (CSP)

Tauri enforces a strict CSP defined in `src-tauri/tauri.conf.json`:

```http
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: http: https:;
media-src 'self' blob: http: https:;
connect-src 'self' blob: http: https: ws: wss:;
worker-src 'self' blob:;
object-src 'none';
```

---

## 3. External URL Security Gate

All external URLs opened from within the application must pass through [`DesktopAdapter.openExternal()`](file:///root/projects/CineTheme/src/platform/desktopAdapter.ts):

- **Blocked Schemes**: `javascript:`, `data:`, `file:`, `vbscript:`, `blob:`.
- **Allowed Schemes**: `https:`, `http:`.
- **Target**: Always opened in the user's default system browser with `noopener,noreferrer`, never replacing the desktop webview window.

---

## 4. Session & Storage Isolation

- **WebView2 Storage**: The Windows client stores active session tokens in WebView2's isolated local storage partition.
- **Zero Token Passing via IPC**: Authentication tokens and passwords are never transmitted across Tauri's IPC bridge to Rust.
- **No Credential Logging**: Neither Rust nor TypeScript logs sensitive session data.
