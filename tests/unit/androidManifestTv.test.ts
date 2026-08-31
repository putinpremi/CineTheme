import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Android TV Manifest & Packaging Verification', () => {
  const manifestPath = path.resolve(__dirname, '../../android/app/src/main/AndroidManifest.xml');
  const bannerPath = path.resolve(__dirname, '../../android/app/src/main/res/drawable/tv_banner.xml');

  it('verifies AndroidManifest.xml exists', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  it('contains Android TV Leanback feature declaration with required="false"', () => {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    expect(manifestContent).toContain('android.software.leanback');
    expect(manifestContent).toMatch(/<uses-feature[^>]*android:name="android\.software\.leanback"[^>]*android:required="false"/);
  });

  it('contains touchscreen required="false" for non-touch TV devices', () => {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    expect(manifestContent).toMatch(/<uses-feature[^>]*android:name="android\.hardware\.touchscreen"[^>]*android:required="false"/);
  });

  it('declares Leanback launcher category on MainActivity', () => {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    expect(manifestContent).toContain('android.intent.category.LEANBACK_LAUNCHER');
  });

  it('declares TV banner attribute on application and activity', () => {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    expect(manifestContent).toContain('android:banner="@drawable/tv_banner"');
  });

  it('verifies tv_banner drawable resource exists', () => {
    expect(fs.existsSync(bannerPath)).toBe(true);
    const bannerContent = fs.readFileSync(bannerPath, 'utf8');
    expect(bannerContent).toContain('<vector');
    expect(bannerContent).toContain('android:width="320dp"');
    expect(bannerContent).toContain('android:height="180dp"');
  });
});
