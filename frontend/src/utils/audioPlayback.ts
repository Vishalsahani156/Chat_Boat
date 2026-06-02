const LANGUAGE_LOCALE: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  ur: 'ur-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  ar: 'ar-SA',
  pt: 'pt-BR',
  ru: 'ru-RU',
  it: 'it-IT'
};

export function toSpeechLocale(language: string): string {
  const code = language.toLowerCase().split('-')[0];
  return LANGUAGE_LOCALE[code] || language;
}

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function stopPlayback(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
  currentUtterance = null;
}

export function playReplyAudio(
  text: string,
  language: string,
  serverAudio?: { mimeType: string; base64: string }
): Promise<void> {
  stopPlayback();

  if (serverAudio) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:${serverAudio.mimeType};base64,${serverAudio.base64}`);
      currentAudio = audio;
      audio.onended = () => {
        currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        currentAudio = null;
        reject(new Error('Audio playback failed'));
      };
      void audio.play().catch(reject);
    });
  }

  if (!window.speechSynthesis) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = toSpeechLocale(language);
    utterance.rate = 1;
    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };
    utterance.onerror = () => {
      currentUtterance = null;
      resolve();
    };
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

export function isPlaying(): boolean {
  return Boolean(currentAudio) || window.speechSynthesis?.speaking;
}
