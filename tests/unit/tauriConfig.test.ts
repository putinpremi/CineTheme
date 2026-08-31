import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Tauri 2 Windows Desktop Configuration & Security Posture', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const tauriDir = path.join(rootDir, 'src-tauri');
  const tauriConfPath = path.join(tauriDir, 'tauri.conf.json');
  const capabilityPath = path.join(tauriDir, 'capabilities/default.json');
  const cargoTomlPath = path.join(tauriDir, 'Cargo.toml');

  it('provides a valid Tauri 2 configuration file', () => {
    expect(fs.existsSync(tauriConfPath)).toBe(true);
    const content = fs.readFileSync(tauriConfPath, 'utf-8');
    const conf = JSON.parse(content);

    expect(conf.productName).toBe('CineTheme');
    expect(conf.identifier).toBe('com.cinetheme.desktop');
    expect(conf.version).toBe('0.1.0');
    expect(conf.build.frontendDist).toBe('../dist');
  });

  it('enforces secure window bounds and dimensions in tauri.conf.json', () => {
    const conf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
    const mainWindow = conf.app.windows.find((w: { label: string }) => w.label === 'main');

    expect(mainWindow).toBeDefined();
    expect(mainWindow.title).toBe('CineTheme');
    expect(mainWindow.width).toBe(1280);
    expect(mainWindow.height).toBe(720);
    expect(mainWindow.minWidth).toBe(1000);
    expect(mainWindow.minHeight).toBe(600);
    expect(mainWindow.resizable).toBe(true);
  });

  it('enforces strict Content Security Policy in tauri.conf.json', () => {
    const conf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
    const csp = conf.app.security.csp;

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).toContain("media-src 'self' blob: http: https:");
    expect(csp).toContain("connect-src 'self' blob: http: https: ws: wss:");
    expect(csp).toContain("object-src 'none'");
  });

  it('defines valid Windows bundle targets and icon assets', () => {
    const conf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
    expect(conf.bundle.active).toBe(true);
    expect(conf.bundle.windows.nsis.installMode).toBe('currentUser');
    expect(conf.bundle.windows.wix.language).toBe('en-US');

    conf.bundle.icon.forEach((iconRelPath: string) => {
      const iconFullPath = path.join(tauriDir, iconRelPath);
      expect(fs.existsSync(iconFullPath)).toBe(true);
    });
  });

  it('enforces least-privilege capability permissions in default.json', () => {
    expect(fs.existsSync(capabilityPath)).toBe(true);
    const cap = JSON.parse(fs.readFileSync(capabilityPath, 'utf-8'));

    expect(cap.permissions).toContain('core:default');
    expect(cap.permissions).toContain('core:window:allow-minimize');
    expect(cap.permissions).toContain('core:window:allow-close');
    expect(cap.permissions).toContain('core:window:allow-set-fullscreen');

    // Verify absence of dangerous permissions
    const prohibitedPrefixes = ['fs:', 'shell:', 'process:', 'http:', 'dialog:'];
    cap.permissions.forEach((perm: string) => {
      prohibitedPrefixes.forEach((prefix) => {
        expect(perm.startsWith(prefix)).toBe(false);
      });
    });
  });

  it('provides a valid Cargo.toml with Tauri 2 dependencies', () => {
    expect(fs.existsSync(cargoTomlPath)).toBe(true);
    const cargoToml = fs.readFileSync(cargoTomlPath, 'utf-8');

    expect(cargoToml).toContain('name = "cinetheme"');
    expect(cargoToml).toContain('tauri = { version = "2.0.0"');
  });
});
