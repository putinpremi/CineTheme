import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Self-Hosting & Docker Distribution Configuration', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
  const dockerignorePath = path.join(rootDir, '.dockerignore');
  const nginxDockerConfPath = path.join(rootDir, 'deployment/nginx-docker.conf');
  const nginxExamplePath = path.join(rootDir, 'deployment/nginx.conf.example');
  const caddyExamplePath = path.join(rootDir, 'deployment/Caddyfile.example');

  it('provides a multi-stage production Dockerfile with non-root execution', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    const dockerfile = fs.readFileSync(dockerfilePath, 'utf-8');

    // Multi-stage builder & runner
    expect(dockerfile).toContain('FROM node:22-alpine AS builder');
    expect(dockerfile).toContain('FROM nginx:alpine AS runner');
    expect(dockerfile).toContain('npm ci');
    expect(dockerfile).toContain('npm run build');

    // Non-root unprivileged runner
    expect(dockerfile).toContain('USER nginx');
    expect(dockerfile).toContain('EXPOSE 8080');
    expect(dockerfile).toContain('HEALTHCHECK');
    expect(dockerfile).toContain('/healthz');
    expect(dockerfile).toContain('deployment/nginx-docker.conf');
  });

  it('provides a production docker-compose.yml with configurable port', () => {
    expect(fs.existsSync(dockerComposePath)).toBe(true);
    const compose = fs.readFileSync(dockerComposePath, 'utf-8');

    expect(compose).toContain('cinetheme:');
    expect(compose).toContain('restart: unless-stopped');
    expect(compose).toContain('8080');
    expect(compose).toContain('healthcheck:');
    expect(compose).toContain('/healthz');
  });

  it('provides a comprehensive .dockerignore protecting secrets and platform trees', () => {
    expect(fs.existsSync(dockerignorePath)).toBe(true);
    const dockerignore = fs.readFileSync(dockerignorePath, 'utf-8');

    expect(dockerignore).toContain('node_modules');
    expect(dockerignore).toContain('dist');
    expect(dockerignore).toContain('dist-release');
    expect(dockerignore).toContain('android');
    expect(dockerignore).toContain('src-tauri');
    expect(dockerignore).toContain('.git');
    expect(dockerignore).toContain('.env');
  });

  it('provides an unprivileged Nginx configuration with SPA routing and security headers', () => {
    expect(fs.existsSync(nginxDockerConfPath)).toBe(true);
    const conf = fs.readFileSync(nginxDockerConfPath, 'utf-8');

    // Unprivileged runtime requirements
    expect(conf).toContain('listen 8080');
    expect(conf).toContain('/tmp/nginx.pid');
    expect(conf).toContain('/tmp/client_temp');

    // Healthcheck endpoint
    expect(conf).toContain('/healthz');
    expect(conf).toContain('return 200');

    // SPA fallback
    expect(conf).toContain('try_files $uri $uri/ /index.html');

    // Security headers & MIME types
    expect(conf).toContain('Content-Security-Policy');
    expect(conf).toContain('Cross-Origin-Opener-Policy');
    expect(conf).toContain('Cross-Origin-Embedder-Policy');
    expect(conf).toContain('application/wasm');
    expect(conf).toContain('application/manifest+json');
    expect(conf).toContain('/sw.js');
  });

  it('provides reverse proxy examples for standard hosting providers', () => {
    expect(fs.existsSync(nginxExamplePath)).toBe(true);
    expect(fs.existsSync(caddyExamplePath)).toBe(true);

    const nginxExample = fs.readFileSync(nginxExamplePath, 'utf-8');
    const caddyExample = fs.readFileSync(caddyExamplePath, 'utf-8');

    expect(nginxExample).toContain('server_name');
    expect(caddyExample).toContain('cinetheme.example.com');
  });
});
