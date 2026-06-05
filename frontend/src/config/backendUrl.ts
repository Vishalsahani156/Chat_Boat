/** Render API — used when VITE_API_URL is unset (common on Vercel if env files are ignored). */
const PRODUCTION_BACKEND_ORIGIN = 'https://chat-hvr7.onrender.com';

/**
 * Production backend origin (Render/Railway). No trailing slash.
 * Override with VITE_API_URL when deploying to a different API host.
 */
export function getBackendOrigin(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (raw) {
    // Strip trailing /api so VITE_API_URL=https://host.onrender.com/api does not become .../api/api/...
    return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  if (import.meta.env.PROD) return PRODUCTION_BACKEND_ORIGIN;
  return '';
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
