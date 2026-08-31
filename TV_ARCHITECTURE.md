# CineTheme Android TV Architecture & 10-Foot Experience

## 1. Overview & Web-First Philosophy

CineTheme is fundamentally a **web-first, flagship Jellyfin client**.
Android TV is a **secondary native shell target** utilizing the same single React 19 + TypeScript codebase as Web, PWA, Windows (Tauri 2), and Android Mobile (Capacitor 8).

The Android TV experience brings a dedicated 10-foot presentation layer, D-pad remote spatial navigation, focus management, and Leanback launcher integration without duplicating business logic, API services, or the video player engine.

---

## 2. Platform & TV Detection Architecture

Platform detection is encapsulated inside [`platformAdapter`](file:///root/projects/CineTheme/src/core/platform/platformAdapter.ts), avoiding ad-hoc user-agent checks across UI components.

### Detection Strategy
1. **User Override**: Direct preference in Settings (`cinetheme_tv_mode_override = 'true' | 'false' | null`).
2. **Global Flag**: Runtime property `window.__CINETHEME_TV_MODE__ === true`.
3. **Android TV User-Agent Signatures**: Matches `Android TV`, `Large Screen`, `GoogleTV`, `BRAVIA`, `AFT` (Fire TV), `SHIELD Android TV`, `SmartTV`, `Tizen`, `Web0S`.
4. **10-Foot Media Query Detection**: `(hover: none) and (pointer: none) and (min-width: 960px)` (indicates a remote-controlled landscape television).

```ts
export type PlatformType = 'web' | 'pwa' | 'windows' | 'android' | 'android-tv';

// platformAdapter.isTVMode() returns true when running on Android TV or when 10-foot mode is forced.
// platformAdapter.getPlatformType() returns 'android-tv' accordingly.
```

---

## 3. 10-Foot UI Presentation Layer

When TV mode is active, [`TvProvider`](file:///root/projects/CineTheme/src/platform/tv/TvProvider.tsx) attaches the `.is-tv` class and `data-tv-mode="true"` attribute to `document.documentElement`.

### Visual & Typography Scaling
- Base typography scales from 16px to 18px (`1.125rem` base, `2.25rem` headers).
- Media cards, shelves, and buttons feature larger touch/focus dimensions.
- **Overscan Margins**: `.tv-overscan-safe` provides 32px safe-area margins against TV display clipping.
- **High-Contrast D-Pad Focus Rings**:
  ```css
  .is-tv *:focus-visible,
  .is-tv [data-focused="true"] {
    outline: 3px solid #818CF8 !important;
    outline-offset: 3px !important;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.45), 0 20px 30px -5px rgba(0, 0, 0, 0.9) !important;
    transform: scale(1.03) !important;
    transition: transform 120ms ease, box-shadow 120ms ease, outline 120ms ease !important;
    z-index: 40 !important;
  }
  ```

---

## 4. D-Pad Spatial Navigation & Focus Management

Spatial navigation is managed by [`SpatialNavigationEngine`](file:///root/projects/CineTheme/src/platform/tv/spatialNavigation.ts) and the [`useSpatialNavigation`](file:///root/projects/CineTheme/src/platform/tv/useSpatialNavigation.ts) hook.

### Navigation Mechanics
- **Key Code Mapping**:
  - `ArrowUp` / KeyCode 19: Navigate Up.
  - `ArrowDown` / KeyCode 20: Navigate Down.
  - `ArrowLeft` / KeyCode 21: Navigate Left.
  - `ArrowRight` / KeyCode 22: Navigate Right.
  - `Enter` / KeyCode 13, 23, 66 (D-Pad Center / OK): Activates focused interactive element.
  - `Escape` / `Backspace` / KeyCode 4 (Back): Triggers mobile/TV back-button LIFO chain.

### 2D Euclidean Distance Metric
When moving focus in direction $D \in \{\text{up}, \text{down}, \text{left}, \text{right}\}$, candidates are filtered to the directional half-plane and ranked using:
$$\text{Distance} = |\Delta_{\text{primary}}| + 2.5 \cdot |\Delta_{\text{secondary}}|$$
This heavily penalizes orthogonal deviation, ensuring focus moves in natural rows and columns.

### Modal Focus Trapping & Restoration
- When a dialog (`[role="dialog"]`, `[aria-modal="true"]`) is open, navigation candidates are strictly trapped inside the dialog container.
- Route transitions save the last active element per route key and restore focus when the user returns.

---

## 5. Android TV Packaging & Leanback Configuration

CineTheme uses a universal Android build configuration supporting both touchscreens (Phones/Tablets) and Android TV remotes in a single package.

### Manifest Configuration (`AndroidManifest.xml`)
1. **Leanback Feature (Non-Mandatory)**:
   ```xml
   <uses-feature android:name="android.software.leanback" android:required="false" />
   ```
2. **Touchscreen Feature (Non-Mandatory)**:
   ```xml
   <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
   <uses-feature android:name="android.hardware.faketouch" android:required="false" />
   ```
3. **Leanback TV Launcher Intent Filter**:
   ```xml
   <intent-filter>
       <action android:name="android.intent.action.MAIN" />
       <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
   </intent-filter>
   ```
4. **TV Banner Asset**:
   - `android:banner="@drawable/tv_banner"` declared on `<application>` and `<activity>`.
   - Vector drawable `res/drawable/tv_banner.xml` (320dp $\times$ 180dp).

---

## 6. Verification Status

| Target | Build / Suite | Status | Details |
|---|---|---|---|
| **Web Production** | `npm run build` | `PASS (COMPLETE + VERIFIED)` | 0 TypeScript errors, bundle size `75.06 kB`. |
| **Vitest Unit Suite** | `npm test -- --run` | `PASS (COMPLETE + VERIFIED)` | 55 test files, 243/243 tests passing. |
| **Playwright E2E** | `npm run test:e2e` | `PASS (COMPLETE + VERIFIED)` | 8/8 browser E2E tests passing. |
| **Android Packaging** | `./android/gradlew assembleDebug` | `PASS (IMPLEMENTED + STATICALLY VERIFIED)` | Manifest verified, Leanback launcher verified, debug APK generated (`6.7 MB`). |
| **Physical Android TV Runtime** | Hardware Device Testing | `PENDING / NOT AVAILABLE` | Physical TV hardware currently unavailable; cloud virtual TV emulators deprecated in Firebase Test Lab. |

