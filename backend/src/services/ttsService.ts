import fs from "fs";
import path from "path";

export interface TtsResult {
  mimeType: string;
  base64: string;
}

/** Map ISO 639-1 codes to BCP-47 for browser / Cloud TTS. */
const LANGUAGE_LOCALE: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ur: "ur-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  ar: "ar-XA",
  pt: "pt-BR",
  ru: "ru-RU",
  it: "it-IT",
};

export function toLocale(language: string): string {
  const code = language.toLowerCase().split("-")[0];
  return LANGUAGE_LOCALE[code] || `${code}-${code.toUpperCase()}`;
}

let ttsClient: { synthesizeSpeech: (req: unknown) => Promise<[{ audioContent?: Buffer | Uint8Array | string }]> } | null = null;

async function getCloudTtsClient() {
  if (ttsClient) return ttsClient;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credPath || !fs.existsSync(path.resolve(credPath))) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
    ttsClient = new TextToSpeechClient();
    return ttsClient;
  } catch {
    return null;
  }
}

export async function synthesize(text: string, language: string): Promise<TtsResult | null> {
  const client = await getCloudTtsClient();
  if (!client) return null;

  const locale = toLocale(language);
  const languageCode = locale.split("-").length >= 2 ? locale : `${language}-US`;

  try {
    const [response] = await client.synthesizeSpeech({
      input: { text: text.slice(0, 5000) },
      voice: { languageCode, ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
    });

    const raw = response.audioContent;
    if (!raw) return null;

    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as string, "base64");
    return {
      mimeType: "audio/mpeg",
      base64: buffer.toString("base64"),
    };
  } catch (err) {
    console.warn("[TTS] Google Cloud synthesis failed, using client fallback:", err);
    return null;
  }
}
