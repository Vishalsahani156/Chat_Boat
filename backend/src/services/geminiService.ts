import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../middleware/errorHandler";
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

/** Default model with reliable free-tier access (see Google AI Studio rate limits). */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

const modelName = () =>
  process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

const getModel = () => {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({ model: modelName() });
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function geminiHttpStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: number }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function isQuotaOrRateLimit(error: unknown): boolean {
  if (geminiHttpStatus(error) === 429) return true;
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

function isInvalidApiKey(error: unknown): boolean {
  if (geminiHttpStatus(error) === 401 || geminiHttpStatus(error) === 403) {
    return true;
  }
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return (
    m.includes("api key not valid") ||
    m.includes("api_key_invalid") ||
    m.includes("invalid api key")
  );
}

function isModelNotFound(error: unknown): boolean {
  if (geminiHttpStatus(error) === 404) return true;
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes("is not found");
}

const QUOTA_MESSAGE =
  "Gemini quota or rate limit exceeded. Wait a few minutes, send fewer messages, or check usage in Google AI Studio.";

function toGeminiAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Error) {
    if (error.message.includes("GEMINI_API_KEY is not set")) {
      return new AppError(error.message, 503);
    }
    if (isInvalidApiKey(error)) {
      return new AppError(
        "Invalid Gemini API key. Create a key at https://aistudio.google.com/apikey and set GEMINI_API_KEY in backend/.env (no quotes needed).",
        503
      );
    }
    if (isModelNotFound(error)) {
      return new AppError(
        `Gemini model "${modelName()}" is unavailable. Set GEMINI_MODEL=${DEFAULT_GEMINI_MODEL} in backend/.env.`,
        503
      );
    }
    if (isQuotaOrRateLimit(error)) {
      return new AppError(QUOTA_MESSAGE, 429);
    }
    return new AppError(error.message || fallback, 500);
  }

  return new AppError(fallback, 500);
}

/** Retries when Google returns transient quota / rate errors (helpful on free tier). */
async function generateContentWithBackoff(
  content: string | Parameters<ReturnType<typeof getModel>["generateContent"]>[0]
): Promise<string> {
  const maxRetries = Math.min(8, Math.max(0, parseInt(process.env.GEMINI_RETRY_MAX || "3", 10)));
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await getModel().generateContent(content);
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

function parseTranscriptionJson(raw: string): { text: string; language: string } {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { text?: string; language?: string };
      return {
        text: String(parsed.text ?? "").trim(),
        language: String(parsed.language ?? "en").toLowerCase().slice(0, 5),
      };
    } catch {
      /* fall through */
    }
  }
  return { text: trimmed, language: "en" };
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; language: string }> {
  try {
    const response = await generateContentWithBackoff([
      {
        inlineData: {
          mimeType,
          data: audioBuffer.toString("base64"),
        },
      },
      {
        text: `Transcribe the spoken audio exactly. Detect the language automatically.
Reply with JSON only, no markdown: {"text":"<transcription>","language":"<ISO 639-1 code e.g. en, hi, ta>"}`,
      },
    ]);
    return parseTranscriptionJson(response);
  } catch (error) {
    console.error("Gemini transcription error:", error);
    throw toGeminiAppError(error, "Failed to transcribe audio. Please try again.");
  }
}

export async function* generateResponseStream(
  message: string,
  history: MessageHistory[]
): AsyncGenerator<string> {
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

  try {
    const streamResult = await getModel().generateContentStream(prompt);
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (error) {
    console.error("Gemini stream error:", error);
    throw toGeminiAppError(error, "Failed to stream AI response. Please try again.");
  }
}

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
    throw toGeminiAppError(error, "Failed to generate AI response. Please try again.");
  }
};
