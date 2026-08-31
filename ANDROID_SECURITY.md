# CineTheme Android Mobile Security Architecture

This document details the security posture, permission boundaries, and storage isolation for the CineTheme Android mobile client.

---

## 1. Principle of Least Privilege

CineTheme requests the absolute minimum permissions in `android/app/src/main/AndroidManifest.xml`:

### Declared Permissions:
- `android.permission.INTERNET`: Required for Jellyfin server communication and media streaming.
- `android.permission.ACCESS_NETWORK_STATE`: Required for offline/online network detection.

### Explicitly Excluded Permissions:
- **No Storage Permissions** (`READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`): Disallowed.
- **No Contacts / Accounts**: Disallowed.
- **No Camera / Microphone**: Disallowed.
- **No Location**: Disallowed.
- **No Phone / SMS**: Disallowed.

---

## 2. Network Security & Cleartext Traffic Policy

Configured via `res/xml/network_security_config.xml`:
- **Default Policy**: Strict HTTPS enforcement for all public domains (`cleartextTrafficPermitted="false"`).
- **LAN HTTP Exception**: Local network addresses (`localhost`, `127.0.0.1`, `10.0.2.2`) permit HTTP so users can connect to local LAN Jellyfin instances without disabling global HTTPS security.

---

## 3. Authentication Storage & Bridge Isolation

- **WebView Local Storage**: Session tokens (`AccessToken`, `serverUrl`, `serverId`, `user`) are stored inside Android's private app sandbox (`/data/data/com.cinetheme.app/app_webview/`).
- **No Token Transmission to Native Plugins**: Authentication tokens are never passed across Capacitor's JavaScript-to-Java bridge.
- **Zero Plaintext Password Storage**: Passwords are never saved in storage, memory stores, or logs.

---

## 4. Share Sheet Sanitization

The native share handler in [`MobileAdapter.share()`](file:///root/projects/CineTheme/src/platform/mobileAdapter.ts) automatically strips sensitive query parameters (`api_key`, `token`, `password`) from shared URLs before launching the Android system share sheet.
