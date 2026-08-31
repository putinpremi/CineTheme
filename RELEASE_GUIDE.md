# CineTheme Production Release & Distribution Guide

This guide details the end-to-end production signing, packaging, and deployment pipeline for all CineTheme platform targets.

---

## 1. Flagship Web & PWA Production Deployment

CineTheme is web-first. Deploying the production web application produces the source of truth for the browser, PWA, Windows (Tauri 2), and Android (Capacitor 8) shells.

### Build Command
```bash
npm run build
```
Output artifacts are generated in `dist/`.

### Recommended Web Server & Security Headers
Configure your hosting provider (Cloudflare Pages, Vercel, Netlify, Nginx, or Caddy) with the following headers:

```http
# Content Security Policy (Strict & Least Privilege)
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; media-src 'self' blob: http: https:; connect-src 'self' http: https: ws: wss:; worker-src 'self' blob:; font-src 'self' data: http: https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';

# Origin & Embedding Isolation
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless

# Service Worker Cache Header
Cache-Control: public, max-age=0, must-revalidate
```

---

## 2. Android Mobile & Android TV (Capacitor 8) Release

CineTheme delivers a universal Android binary supporting Android Phones, Tablets, and Android TV / Google TV.

### Android Package Coordinates
- **Application ID:** `com.cinetheme.app`
- **Version Name:** `0.1.0`
- **Version Code:** `1`
- **Minimum SDK:** `24` (Android 7.0 Nougat)
- **Target SDK:** `36` (Android 16 / Vanilla Ice Cream)
- **Required Permissions:** `INTERNET`, `ACCESS_NETWORK_STATE` (0 dangerous runtime permissions requested)

### Step 1: Sync Production Assets
```bash
npm run build
npx cap sync android
```

### Step 2: Generate Release Keystore (First-Time Setup)
```bash
keytool -genkey -v -keystore release.keystore -alias cinetheme -keyalg RSA -keysize 2048 -validity 10000
```
*Store `release.keystore` and passwords securely in your CI/CD secret manager.*

### Step 3: Configure Signing Properties
Create or configure `android/keystore.properties`:
```properties
storeFile=/path/to/release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=cinetheme
keyPassword=YOUR_KEY_PASSWORD
```

### Step 4: Build Release Targets
- **Google Play Store Android App Bundle (AAB):**
  ```bash
  ./android/gradlew -p android bundleRelease
  # Output: android/app/build/outputs/bundle/release/app-release.aab
  ```
- **Sideloadable / Direct Install Release APK:**
  ```bash
  ./android/gradlew -p android assembleRelease
  # Output: android/app/build/outputs/apk/release/app-release.apk
  ```

---

## 3. Windows Desktop (Tauri 2) Release

### Prerequisites
- Rust 1.80+
- Visual Studio C++ Build Tools
- Microsoft Edge WebView2 runtime

### Build Command
```bash
npm run tauri build
```
Output artifacts:
- NSIS Installer: `src-tauri/target/release/bundle/nsis/CineTheme_0.1.0_x64-setup.exe`
- MSI Package: `src-tauri/target/release/bundle/msi/CineTheme_0.1.0_x64_en-US.msi`

---

## 4. Pre-Release Quality Verification Checklist

Before publishing any release artifact, verify that all quality gates pass:

```bash
# 1. Type Safety
npm run typecheck

# 2. Linting & Formatting
npm run lint

# 3. Vitest Unit & Integration Suite
npm test -- --run

# 4. Playwright Browser E2E Suite
npm run test:e2e

# 5. Production Web Asset Compilation
npm run build

# 6. Android Asset Sync & Gradle Compilation
npx cap sync android
./android/gradlew -p android assembleDebug
```
