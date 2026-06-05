import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_BACKEND_TARGET = 'http://127.0.0.1:5000';

/**
 * Resolves backend URL for `/api` and `/socket.io` proxy in dev.
 *
 * Order:
 * 1. VITE_DEV_API_TARGET (frontend `.env*` or shell) — use when Docker runs the API on :5000
 *    while `backend/.env` PORT differs (common mismatch).
 * 2. PORT from `backend/.env` (matches `npm run dev` inside backend/).
 * 3. Default localhost:5000 (docker-compose exposes API on 5000; README uses 5000).
 */
function resolveBackendDevProxyTarget(explicit?: string): string {
  if (explicit) return explicit;

  const backendEnvPath = resolve(__dirname, '../backend/.env');
  if (!existsSync(backendEnvPath)) {
    return DEFAULT_BACKEND_TARGET;
  }

  const raw = readFileSync(backendEnvPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith('#') || !t) continue;
    const m = t.match(/^PORT\s*=\s*["']?(\d+)["']?/i);
    if (m) return `http://127.0.0.1:${m[1]}`;
  }

  return DEFAULT_BACKEND_TARGET;
}

const PRODUCTION_BACKEND_ORIGIN = 'https://chat-hvr7.onrender.com';

export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, __dirname, '');
  const explicit =
    viteEnv.VITE_DEV_API_TARGET?.trim() ||
    process.env.VITE_DEV_API_TARGET?.trim();
  const apiProxyTarget = resolveBackendDevProxyTarget(explicit || undefined);

  const envApi =
    viteEnv.VITE_API_URL?.trim() ||
    process.env.VITE_API_URL?.trim() ||
    '';
  const apiOrigin =
    envApi.replace(/\/api\/?$/, '').replace(/\/$/, '') ||
    (mode === 'production' ? PRODUCTION_BACKEND_ORIGIN : '');

  return {
    plugins: [react()],
    define: {
      __APP_API_ORIGIN__: JSON.stringify(apiOrigin),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        },
        '/socket.io': {
          target: apiProxyTarget,
          changeOrigin: true,
          ws: true
        }
      }
    }
  };
});
