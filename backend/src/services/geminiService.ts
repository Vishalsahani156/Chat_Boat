import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../middleware/errorHandler";
import { MessageHistory } from "../types";

export type ResponseMode = "text" | "voice";

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

const VOICE_SYSTEM_PROMPT = `You are a helpful voice assistant in a spoken conversation.
Rules:
- Reply in the same language the user spoke (Hindi, English, Hinglish, or other). Do not translate unless asked.
- Use 2 to 4 short, natural sentences suitable for listening aloud.
- Use plain spoken language only: no markdown, bullet lists, code blocks, or symbols like * or #.
- Be warm and conversational, like the Gemini voice experience.`;

const TRANSCRIBE_INSTRUCTION = `Transcribe the spoken audio exactly as heard.
- Support Hindi, English, Hinglish (code-switching), and other languages.
- Do NOT translate: write what was actually spoken.
- For mixed Hindi-English, keep the mix in the transcription.
- Detect the primary language as ISO 639-1 (en, hi, ta, etc.).

Examples of valid JSON output:
{"text":"आज मौसम कैसा है?","language":"hi"}
{"text":"What is the weather today?","language":"en"}
{"text":"Aaj weather kaisa hai?","language":"hi"}

Reply with JSON only, no markdown:
{"text":"<transcription>","language":"<ISO 639-1 code>"}`;

function systemPromptForMode(mode: ResponseMode): string {
  return mode === "voice" ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT;
}

function buildChatPrompt(
  message: string,
  history: MessageHistory[],
  mode: ResponseMode
): string {
  const recentHistory = history.slice(-10);
  const contextLines = recentHistory.map(
    (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
  );

  return [
    systemPromptForMode(mode),
    ...(contextLines.length > 0
      ? ["", "Previous conversation:", ...contextLines, ""]
      : [""]),
    `User: ${message}`,
    "Assistant:",
  ].join("\n");
}

function stripModelFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseTranscriptionJson(raw: string): { text: string; language: string } {
  const trimmed = stripModelFences(raw.trim());
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { text?: string; language?: string };
      const text = String(parsed.text ?? "").trim();
      const language = String(parsed.language ?? "en").toLowerCase().slice(0, 5);
      if (text) {
        return { text, language };
      }
    } catch {
      /* fall through */
    }
  }
  if (trimmed && !trimmed.startsWith("{")) {
    return { text: trimmed, language: "en" };
  }
  return { text: "", language: "en" };
}

function parseVoiceTurnJson(raw: string): {
  text: string;
  language: string;
  reply: string;
} {
  const trimmed = stripModelFences(raw.trim());
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        text?: string;
        language?: string;
        reply?: string;
      };
      const text = String(parsed.text ?? "").trim();
      const reply = String(parsed.reply ?? "").trim();
      const language = String(parsed.language ?? "en").toLowerCase().slice(0, 5);
      if (text && reply) {
        return { text, language, reply };
      }
      if (reply && !text) {
        return { text: "(voice message)", language, reply };
      }
      if (text && !reply) {
        return { text, language, reply: text };
      }
    } catch {
      /* fall through */
    }
  }
  if (trimmed && !trimmed.startsWith("{")) {
    return { text: "(voice message)", language: "en", reply: trimmed };
  }
  return { text: "", language: "en", reply: "" };
}

function buildVoiceTurnInstruction(history: MessageHistory[]): string {
  const recentHistory = history.slice(-10);
  const contextLines = recentHistory.map(
    (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
  );

  const contextBlock =
    contextLines.length > 0
      ? `Previous conversation:\n${contextLines.join("\n")}\n\n`
      : "";

  return `${contextBlock}Listen to the audio, transcribe it, and reply as the voice assistant.
${VOICE_SYSTEM_PROMPT}

Reply with JSON only, no markdown:
{"text":"<exact transcription>","language":"<ISO 639-1>","reply":"<spoken reply in same language>"}`;
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
      { text: TRANSCRIBE_INSTRUCTION },
    ]);
    return parseTranscriptionJson(response);
  } catch (error) {
    console.error("Gemini transcription error:", error);
    throw toGeminiAppError(error, "Failed to transcribe audio. Please try again.");
  }
}

export async function processVoiceTurn(
  audioBuffer: Buffer,
  mimeType: string,
  history: MessageHistory[]
): Promise<{ text: string; language: string; reply: string }> {
  try {
    const response = await generateContentWithBackoff([
      {
        inlineData: {
          mimeType,
          data: audioBuffer.toString("base64"),
        },
      },
      { text: buildVoiceTurnInstruction(history) },
    ]);
    const parsed = parseVoiceTurnJson(response);
    if (!parsed.text.trim()) {
      throw new AppError("Could not understand audio. Please try again.", 400);
    }
    if (!parsed.reply.trim()) {
      throw new Error("Empty response from Gemini");
    }
    return parsed;
  } catch (error) {
    console.error("Gemini voice turn error:", error);
    throw toGeminiAppError(error, "Failed to process voice message. Please try again.");
  }
}

export async function* generateResponseStream(
  message: string,
  history: MessageHistory[],
  mode: ResponseMode = "text"
): AsyncGenerator<string> {
  const prompt = buildChatPrompt(message, history, mode);

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
  history: MessageHistory[],
  mode: ResponseMode = "text"
): Promise<string> => {
  try {
    const prompt = buildChatPrompt(message, history, mode);
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
