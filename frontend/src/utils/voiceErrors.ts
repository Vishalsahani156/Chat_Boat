import axios from 'axios';
import { getNetworkErrorMessage } from './networkErrors';

const HINTS: Array<{ match: RegExp; message: string }> = [
  {
    match: /cannot reach the server|econnrefused|network error/i,
    message: getNetworkErrorMessage(),
  },
  {
    match: /could not connect for live voice|connection lost/i,
    message:
      'Live voice needs a stable connection. Restart the backend, refresh the page, then try again.',
  },
  {
    match: /quota|rate limit|429/i,
    message: 'Gemini rate limit reached. Wait a minute and try again.',
  },
  {
    match: /could not understand audio|recording too short/i,
    message: 'Speak for at least 2 seconds, then stop recording.',
  },
  {
    match: /unsupported audio/i,
    message: 'Audio format not supported. Use Chrome or Firefox and try again.',
  },
  {
    match: /too many voice requests/i,
    message: 'Too many voice requests. Wait a moment and try again.',
  },
  {
    match: /microphone|not allowed|permission/i,
    message: 'Allow microphone access in your browser settings.',
  },
  {
    match: /gemini api key|invalid.*key/i,
    message: import.meta.env.DEV
      ? 'Gemini API key issue on the server. Check GEMINI_API_KEY in backend/.env.'
      : 'Voice service is temporarily unavailable. Please try again later.',
  },
  {
    match: /failed to transcribe|failed to process voice/i,
    message: import.meta.env.DEV
      ? 'Voice processing failed. Check backend logs and GEMINI_API_KEY.'
      : 'Voice processing failed. Please try again.',
  },
];

export function getVoiceErrorMessage(err: unknown, fallback = 'Voice request failed'): string {
  let raw = fallback;

  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return HINTS[0].message;
    }
    const data = err.response.data as { message?: string } | undefined;
    if (typeof data?.message === 'string') {
      raw = data.message;
    }
  } else if (err instanceof Error) {
    raw = err.message;
  } else if (typeof err === 'string') {
    raw = err;
  }

  for (const { match, message } of HINTS) {
    if (match.test(raw)) {
      return message;
    }
  }

  return raw;
}
