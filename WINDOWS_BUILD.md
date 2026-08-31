# CineTheme Windows Desktop Build & Packaging Guide

This guide details instructions for building and packaging CineTheme for Windows (x64) using Tauri 2.

---

## 1. Prerequisites (Windows Build Host)

To build the native Windows installer:

1. **Rust Toolchain**:
   ```powershell
   # Install Rust with MSVC toolchain
   rustup default stable-x86_64-pc-windows-msvc
   ```
2. **Visual Studio C++ Build Tools**:
   - Install "Desktop development with C++" workload from Visual Studio Installer.
3. **Microsoft Edge WebView2**:
   - Installed by default on Windows 10 (1809+) and Windows 11.
4. **Node.js & npm**:
   - Node `>= 20.0.0`

---

## 2. Development & Local Debugging

```powershell
# Install npm dependencies
npm install

# Launch Tauri development desktop client with Vite Hot-Module Replacement
npx tauri dev
```

---

## 3. Production Build & Packaging

```powershell
# Build production bundle and Windows installers
npm run build
npx tauri build
```

### Build Artifacts Output:
- **NSIS Installer (`.exe`)**: `src-tauri/target/release/bundle/nsis/CineTheme_0.1.0_x64-setup.exe`
- **MSI Installer (`.msi`)**: `src-tauri/target/release/bundle/msi/CineTheme_0.1.0_x64_en-US.msi`
- **Standalone Binary**: `src-tauri/target/release/cinetheme.exe`

---

## 4. Code Signing

For production release distribution on Windows:
- Obtain a valid Authenticode Code Signing Certificate (EV or Standard).
- Configure signing in CI/CD via Microsoft `signtool.exe` or Tauri environment variables:
  ```powershell
  $env:TAURI_SIGNING_PRIVATE_KEY="path/to/key.key"
  $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD="password"
  ```
- Unsigned development builds are fully functional for local testing and sideloading.
