/**
 * Platform Detection & Cross-Platform Utilities
 * Supports Web SPA, Android Native (Capacitor), and Windows/Desktop (Electron).
 */

export function isElectron(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).electron ||
    (window as any).process?.type === 'renderer' ||
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).Capacitor?.isNativePlatform?.() ||
    (window as any).Capacitor?.getPlatform?.() === 'android' ||
    (window as any).Capacitor?.getPlatform?.() === 'ios' ||
    (window as any).Capacitor?.isNative
  );
}

export function isWeb(): boolean {
  return !isNative() && !isElectron();
}

/**
 * Returns API base URL ensuring absolute HTTPS or relative path on web.
 * Fails with a clear error message if empty in native or desktop builds.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '';

  if (isNative() || isElectron()) {
    if (!envUrl) {
      throw new Error(
        'VITE_API_BASE_URL is missing. Native (Capacitor) and desktop (Electron) builds require an absolute HTTPS API base URL (e.g. https://api.yourdomain.com).'
      );
    }
    if (!envUrl.startsWith('https://') && !envUrl.startsWith('http://')) {
      throw new Error(
        `Invalid VITE_API_BASE_URL "${envUrl}". Native and desktop builds require an absolute HTTPS URL.`
      );
    }
    return envUrl.replace(/\/$/, '');
  }

  // Web SPA environment: return absolute URL if configured, or empty string for same-origin relative paths
  return envUrl ? envUrl.replace(/\/$/, '') : '';
}

/**
 * Opens external URLs safely across Web, Android (Capacitor), and Desktop (Electron).
 * Handles Drive, YouTube, WhatsApp Click-to-Chat (wa.me), and UPI deep links (upi://).
 */
export function openExternalUrl(url: string): void {
  if (!url) return;

  const cleanUrl = url.trim();

  // 1. Electron Desktop
  if (isElectron()) {
    const electron = (window as any).electron;
    if (electron?.openExternal) {
      electron.openExternal(cleanUrl);
      return;
    }
    const requireFn = (window as any).require;
    if (requireFn) {
      try {
        const shell = requireFn('electron')?.shell;
        if (shell?.openExternal) {
          shell.openExternal(cleanUrl);
          return;
        }
      } catch {
        // Fallback
      }
    }
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // 2. Capacitor Android/iOS Native Wrapper
  if (isNative()) {
    const capacitor = (window as any).Capacitor;

    // UPI deep links (upi://) and app intents on Android
    if (cleanUrl.startsWith('upi://') || cleanUrl.startsWith('intent://') || cleanUrl.startsWith('whatsapp://')) {
      if (capacitor?.Plugins?.App?.openUrl) {
        capacitor.Plugins.App.openUrl({ url: cleanUrl });
        return;
      }
      window.location.href = cleanUrl;
      return;
    }

    // System browser plugin for external HTTP/HTTPS links
    if (capacitor?.Plugins?.Browser?.open) {
      capacitor.Plugins.Browser.open({ url: cleanUrl });
      return;
    }

    // Fallback for native environment
    window.location.href = cleanUrl;
    return;
  }

  // 3. Web SPA
  if (cleanUrl.startsWith('upi://')) {
    window.location.href = cleanUrl;
    return;
  }

  window.open(cleanUrl, '_blank', 'noopener,noreferrer');
}
