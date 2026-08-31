import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Android Release Signing Configuration & Secrets Protection', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const gitignorePath = path.join(rootDir, '.gitignore');
  const buildGradlePath = path.join(rootDir, 'android/app/build.gradle');
  const examplePropertiesPath = path.join(rootDir, 'android/keystore.properties.example');

  it('protects keystores and signing properties in .gitignore', () => {
    expect(fs.existsSync(gitignorePath)).toBe(true);
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

    expect(gitignore).toContain('*.keystore');
    expect(gitignore).toContain('*.jks');
    expect(gitignore).toContain('keystore.properties');
    expect(gitignore).toContain('android/keystore.properties');
  });

  it('contains zero hardcoded secrets in android/app/build.gradle', () => {
    expect(fs.existsSync(buildGradlePath)).toBe(true);
    const buildGradle = fs.readFileSync(buildGradlePath, 'utf-8');

    expect(buildGradle).not.toMatch(/storePassword\s+["'][^"']+["']/);
    expect(buildGradle).not.toMatch(/keyPassword\s+["'][^"']+["']/);
    expect(buildGradle).toContain('keystorePropertiesFile');
    expect(buildGradle).toContain('signingConfigs');
    expect(buildGradle).toContain('hasReleaseSigning');
  });

  it('provides a clean keystore.properties.example template', () => {
    expect(fs.existsSync(examplePropertiesPath)).toBe(true);
    const template = fs.readFileSync(examplePropertiesPath, 'utf-8');

    expect(template).toContain('storeFile');
    expect(template).toContain('storePassword');
    expect(template).toContain('keyAlias');
    expect(template).toContain('keyPassword');
  });

  it('does not have real keystore files committed in repository', () => {
    const trackedFiles = execSync('git ls-files', { cwd: rootDir, encoding: 'utf-8' });

    expect(trackedFiles).not.toMatch(/\.keystore$/m);
    expect(trackedFiles).not.toMatch(/\.jks$/m);
    expect(trackedFiles).not.toMatch(/^keystore\.properties$/m);
    expect(trackedFiles).not.toMatch(/^android\/keystore\.properties$/m);
  });
});
