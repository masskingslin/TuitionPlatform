/**
 * Zero-Cost External Link & Document Helper Service
 * Replaces paid Firebase Storage with free external HTTPS links (Google Drive, YouTube, Docs, etc.)
 */

export interface LinkValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that a string is a secure HTTPS link (Google Drive, YouTube, Dropbox, etc.)
 */
export function validateHttpsUrl(urlString: string): LinkValidationResult {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Please enter a valid document or resource link.' };
  }

  const trimmed = urlString.trim();
  if (!trimmed.startsWith('https://')) {
    return {
      valid: false,
      error: 'Only secure HTTPS links are allowed (e.g. https://drive.google.com/..., https://youtube.com/...)'
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Link protocol must be HTTPS.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid URL syntax.' };
  }
}

/**
 * Returns true if a given URL is a valid HTTPS link
 */
export function isValidHttpsUrl(urlString: string): boolean {
  return validateHttpsUrl(urlString).valid;
}

/**
 * Safely opens an external HTTPS document or media resource in a new tab
 */
export function openExternalLink(url: string): void {
  if (!url) return;
  const targetUrl = url.trim();
  if (targetUrl.startsWith('https://')) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Opens or downloads the link in browser
 */
export function downloadFile(url: string, _fileName?: string): void {
  openExternalLink(url);
}
