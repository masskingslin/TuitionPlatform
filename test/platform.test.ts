import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { isNative, isElectron, isWeb, getApiBaseUrl, openExternalUrl } from '../src/platform';

describe('Cross-Platform Helpers (src/platform.ts)', () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    (globalThis as any).window = {
      navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 10)' },
      location: { href: '' },
      open: () => {}
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  test('isWeb() returns true in standard web browser environment', () => {
    expect(isNative()).toBe(false);
    expect(isElectron()).toBe(false);
    expect(isWeb()).toBe(true);
  });

  test('isNative() returns true when Capacitor is present', () => {
    (window as any).Capacitor = { isNativePlatform: () => true };
    expect(isNative()).toBe(true);
    expect(isWeb()).toBe(false);
  });

  test('isElectron() returns true when electron renderer is present', () => {
    (window as any).electron = { openExternal: () => {} };
    expect(isElectron()).toBe(true);
    expect(isWeb()).toBe(false);
  });

  test('getApiBaseUrl() returns configured API base URL or relative string', () => {
    const url = getApiBaseUrl();
    expect(typeof url).toBe('string');
  });

  test('getApiBaseUrl() throws error in native environment if VITE_API_BASE_URL is missing', () => {
    (window as any).Capacitor = { isNativePlatform: () => true };
    if (!import.meta.env.VITE_API_BASE_URL) {
      expect(() => getApiBaseUrl()).toThrow('VITE_API_BASE_URL is missing');
    }
  });

  test('openExternalUrl executes without error', () => {
    expect(() => openExternalUrl('https://drive.google.com')).not.toThrow();
    expect(() => openExternalUrl('upi://pay?pa=test@upi')).not.toThrow();
  });
});
