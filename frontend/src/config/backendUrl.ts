/** Injected at build time by vite.config.ts (always set for production builds). */
declare const __APP_API_ORIGIN__: string;

/**
 * Production backend origin (Render/Railway). No trailing slash.
 * Override with VITE_API_URL when deploying to a different API host.
 */
export function getBackendOrigin(): string {
  if (typeof __APP_API_ORIGIN__ === 'string' && __APP_API_ORIGIN__) {
    return __APP_API_ORIGIN__;
  }
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (raw) {
    return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
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
