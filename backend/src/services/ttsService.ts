import { Communicate, VoicesManager } from "edge-tts-universal";

export interface TtsResult {
  mimeType: string;
  base64: string;
}

/** Map ISO 639-1 codes to BCP-47 locales for voice selection. */
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
  ar: "ar-SA",
  pt: "pt-BR",
  ru: "ru-RU",
  it: "it-IT",
};

/** Default Edge neural voices per locale (no API key required). */
const PREFERRED_VOICES: Record<string, string> = {
  "en-US": "en-US-JennyNeural",
  "hi-IN": "hi-IN-SwaraNeural",
  "ta-IN": "ta-IN-PallaviNeural",
  "te-IN": "te-IN-ShrutiNeural",
  "bn-IN": "bn-IN-TanishaaNeural",
  "mr-IN": "mr-IN-AarohiNeural",
  "gu-IN": "gu-IN-DhwaniNeural",
  "kn-IN": "kn-IN-SapnaNeural",
  "ml-IN": "ml-IN-SobhanaNeural",
  "pa-IN": "pa-IN-VaaniNeural",
  "ur-IN": "ur-IN-GulNeural",
  "es-ES": "es-ES-ElviraNeural",
  "fr-FR": "fr-FR-DeniseNeural",
  "de-DE": "de-DE-KatjaNeural",
  "ja-JP": "ja-JP-NanamiNeural",
  "ko-KR": "ko-KR-SunHiNeural",
  "zh-CN": "zh-CN-XiaoxiaoNeural",
  "ar-SA": "ar-SA-ZariyahNeural",
  "pt-BR": "pt-BR-FranciscaNeural",
  "ru-RU": "ru-RU-SvetlanaNeural",
  "it-IT": "it-IT-ElsaNeural",
};

const MAX_TTS_CHARS = 5000;
const FALLBACK_VOICE = "en-US-JennyNeural";

export function toLocale(language: string): string {
  const code = language.toLowerCase().split("-")[0];
  return LANGUAGE_LOCALE[code] || `${code}-${code.toUpperCase()}`;
}

let voicesManager: VoicesManager | null = null;
const voiceByLocale = new Map<string, string>();

async function getVoicesManager(): Promise<VoicesManager> {
  if (!voicesManager) {
    voicesManager = await VoicesManager.create();
  }
  return voicesManager;
}

async function resolveVoice(language: string): Promise<string> {
  const override = process.env.TTS_VOICE_DEFAULT?.trim();
  if (override && override !== "auto") {
    return override;
  }

  const locale = toLocale(language);
  const cached = voiceByLocale.get(locale);
  if (cached) return cached;

  const preferred = PREFERRED_VOICES[locale];
  if (preferred) {
    voiceByLocale.set(locale, preferred);
    return preferred;
  }

  const vm = await getVoicesManager();
  const byLocale = vm.find({ Locale: locale });
  if (byLocale.length > 0) {
    const neural =
      byLocale.find((v) => v.ShortName.includes("Neural")) ?? byLocale[0];
    voiceByLocale.set(locale, neural.ShortName);
    return neural.ShortName;
  }

  const lang = locale.split("-")[0];
  const byLang = vm.find({ Language: lang });
  if (byLang.length > 0) {
    const neural =
      byLang.find((v) => v.ShortName.includes("Neural")) ?? byLang[0];
    voiceByLocale.set(locale, neural.ShortName);
    return neural.ShortName;
  }

  voiceByLocale.set(locale, FALLBACK_VOICE);
  return FALLBACK_VOICE;
}

export async function synthesize(
  text: string,
  language: string
): Promise<TtsResult | null> {
  const input = text.slice(0, MAX_TTS_CHARS).trim();
  if (!input) return null;

  try {
    const voice = await resolveVoice(language);
    const communicate = new Communicate(input, { voice });
    const chunks: Buffer[] = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === "audio" && chunk.data) {
        chunks.push(
          Buffer.isBuffer(chunk.data) ? chunk.data : Buffer.from(chunk.data)
        );
      }
    }

    if (chunks.length === 0) return null;

    const buffer = Buffer.concat(chunks);
    return {
      mimeType: "audio/mpeg",
      base64: buffer.toString("base64"),
    };
  } catch (err) {
    console.warn(
      "[TTS] Server synthesis failed; client may use browser fallback:",
      err
    );
    return null;
  }
}
