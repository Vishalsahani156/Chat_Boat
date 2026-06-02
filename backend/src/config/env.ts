/** Trim + lowercase. Gmail dot/+tag normalization runs in validation middleware via .normalizeEmail(). */
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

/** Fail fast at startup if Gemini is not configured (voice + chat need it). */
export function validateGeminiConfig(): void {
  const key = process.env.GEMINI_API_KEY?.trim() || "";
  if (!key || key === "your-gemini-api-key" || key.includes("your-gemini")) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add a valid key from https://aistudio.google.com/apikey to backend/.env"
    );
  }
}
