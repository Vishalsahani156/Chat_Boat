/**
 * Frees the dev API port before `npm run dev` (fixes EADDRINUSE from a stale ts-node-dev).
 * Uses PORT from env or backend/.env; Linux: fuser -k.
 */
const { execSync } = require("child_process");
const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

let port = process.env.PORT || "5000";
const envPath = resolve(__dirname, "../.env");
if (existsSync(envPath)) {
  const match = readFileSync(envPath, "utf8").match(/^PORT\s*=\s*["']?(\d+)/m);
  if (match) port = match[1];
}

try {
  execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
  console.log(`[dev] Freed port ${port} (previous process stopped)`);
} catch {
  // Port was free or fuser unavailable — continue
}
