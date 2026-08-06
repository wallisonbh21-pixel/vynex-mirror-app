import { z } from 'zod';

/**
 * ScaleNexus Security Utility - URL Sanitization
 * Prevents javascript: URI injection and other malicious schemes.
 */
export function sanitizeExternalUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  const trimmedUrl = url.trim();
  if (trimmedUrl === '') return undefined;

  // Allowed schemes: http, https, mailto, tel
  const allowedSchemes = ['https://', 'http://', 'mailto:', 'tel:'];
  
  const hasAllowedScheme = allowedSchemes.some(scheme => 
    trimmedUrl.toLowerCase().startsWith(scheme)
  );

  if (hasAllowedScheme) {
    return trimmedUrl;
  }

  // If no scheme, check if it looks like a domain and prepend https
  if (!trimmedUrl.includes(':') && trimmedUrl.includes('.')) {
    return `https://${trimmedUrl}`;
  }

  // Block everything else (javascript:, data:, etc.)
  console.warn(`[Security] Blocked potentially malicious URL: ${trimmedUrl}`);
  return undefined;
}
