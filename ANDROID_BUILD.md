# CineTheme Android Mobile Build & Packaging Guide

This guide details instructions for building and packaging the CineTheme Android application (APK and AAB) using Capacitor 8.

---

## 1. Prerequisites (Android Build Host)

To build the Android application:
1. **Java Development Kit (JDK)**: JDK 21
2. **Android SDK**: Platform SDK 34 / 35 with Android SDK Build-Tools.
3. **Node.js & npm**: Node `>= 20.0.0`
4. **Android Studio** (optional, for visual debugging and emulator management).

---

## 2. Syncing Web Assets to Android

```bash
# Build the production web application
npm run build

# Sync web assets and Capacitor plugins into the android/ Gradle project
npx cap sync android
```

---

## 3. Development Debug Build (APK)

```bash
cd android
./gradlew assembleDebug
```

### Debug Artifact Output:
- `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 4. Production Release Build (AAB for Google Play)

```bash
cd android
./gradlew bundleRelease
```

### Release Artifact Output:
- `android/app/build/outputs/bundle/release/app-release.aab`

---

## 5. Google Play Store Readiness Checklist

- **Package ID**: `com.cinetheme.app`
- **Application Name**: `CineTheme`
- **Target SDK**: API 34+ (Android 14/15)
- **Minimum SDK**: API 24 (Android 7.0 Nougat)
- **App Bundle Format**: Android App Bundle (`.aab`)
- **Release Signing**: Configure `RELEASE_STORE_FILE`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, and `RELEASE_KEY_PASSWORD` in Gradle or CI secrets.
- **Privacy Policy**: Required for Google Play Store listing (discloses Jellyfin local client network access).
