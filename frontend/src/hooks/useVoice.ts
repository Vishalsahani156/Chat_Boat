import { useState, useCallback } from 'react';
import { playReplyAudio, stopPlayback, isPlaying } from '../utils/audioPlayback';

/** Read-aloud for message bubbles (language-aware browser TTS). */
export function useVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string, language = 'en') => {
    setIsSpeaking(true);
    try {
      await playReplyAudio(text, language);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    stopPlayback();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking: isSpeaking || isPlaying(),
    speak,
    stopSpeaking
  };
}
