/**
 * Production backend origin (Render/Railway). No trailing slash.
 * Leave unset on Vercel when using `vercel.json` rewrites (same-origin `/api`).
 */
export function getBackendOrigin(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return '';
  return raw.replace(/\/$/, '');
}

/** Axios base URL: `/api` (proxied) or `https://api.example.com/api` (direct). */
export function getApiBaseUrl(): string {
  const origin = getBackendOrigin();
  return origin ? `${origin}/api` : '/api';
}

/** Full path under `/api`, e.g. `/chat/stream`. */
export function apiPath(suffix: string): string {
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${getApiBaseUrl()}${path}`;
}

/** Socket.IO server URL. */
export function getSocketUrl(): string {
  return getBackendOrigin() || window.location.origin;
}
