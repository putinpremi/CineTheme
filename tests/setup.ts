import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

beforeAll(() => {
  // Start MSW interception before all tests
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL for JSDOM
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn((_blob: Blob | MediaSource) => `blob:http://localhost/${Math.random().toString(36).substring(2)}`);
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn();
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
