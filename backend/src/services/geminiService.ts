import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageHistory } from "../types";

const getApiKey = (): string => {
  const key = process.env.GEMINI_API_KEY?.trim() || "";
  if (!key || key === "your-gemini-api-key" || key.includes("your-gemini")) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add a valid key from https://aistudio.google.com/apikey to backend/.env"
    );
  }
  return key;
};

const modelName = () =>
  process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

const getModel = () => {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({ model: modelName() });
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isQuotaOrRateLimit(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return (
    m.includes("quota") ||
    m.includes("rate") ||
    m.includes("429") ||
    m.includes("resource exhausted") ||
    m.includes("too many requests")
  );
}

/** Retries when Google returns transient quota / rate errors (helpful on free tier). */
async function generateContentWithBackoff(prompt: string): Promise<string> {
  const maxRetries = Math.min(8, Math.max(0, parseInt(process.env.GEMINI_RETRY_MAX || "3", 10)));
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await getModel().generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      if (!isQuotaOrRateLimit(err) || attempt === maxRetries) {
        throw err;
      }
      const delayMs = Math.min(45_000, 1500 * 2 ** attempt);
      console.warn(
        `[Gemini] quota/rate limit, retry ${attempt + 1}/${maxRetries} after ${delayMs}ms (model=${modelName()})`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

const SYSTEM_PROMPT =
  "You are a helpful AI assistant. Be concise and accurate. Keep responses brief unless asked for detail.";

export const generateResponse = async (
  message: string,
  history: MessageHistory[]
): Promise<string> => {
  try {
    const recentHistory = history.slice(-10);

    const contextLines = recentHistory.map(
      (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
    );

    const prompt = [
      SYSTEM_PROMPT,
      ...(contextLines.length > 0
        ? ["", "Previous conversation:", ...contextLines, ""]
        : [""]),
      `User: ${message}`,
      "Assistant:",
    ].join("\n");

    const response = await generateContentWithBackoff(prompt);

    if (!response) {
      throw new Error("Empty response from Gemini");
    }

    return response;
  } catch (error) {
    console.error("Gemini API error:", error);

    if (error instanceof Error) {
      if (error.message.includes("GEMINI_API_KEY is not set")) {
        throw error;
      }
      if (error.message.includes("API key")) {
        throw new Error("Invalid Gemini API key. Please check your configuration.");
      }
      if (isQuotaOrRateLimit(error)) {
        throw new Error(
          "Gemini quota or rate limit is still exceeded. Wait 5–10 minutes, send fewer messages in a burst, or check usage and billing in Google AI Studio (https://aistudio.google.com/)."
        );
      }
    }

    throw new Error("Failed to generate AI response. Please try again.");
  }
};
