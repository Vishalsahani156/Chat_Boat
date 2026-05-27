/** Shared email normalization for register/login (trim + lowercase only). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function validateAuthConfig(): void {
  getRequiredEnv("JWT_SECRET");
}
