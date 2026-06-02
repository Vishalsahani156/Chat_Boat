import { useState, useCallback } from 'react';
import axios from 'axios';
import { Message } from '../types';
import { sendVoiceAudio } from '../services/api';
import { playReplyAudio, stopPlayback, isPlaying } from '../utils/audioPlayback';
import { useAudioRecorder } from './useAudioRecorder';

export type VoiceChatStatus = 'idle' | 'recording' | 'processing' | 'speaking';

interface UseVoiceChatOptions {
  conversationId: string | null;
  onMessages: (userMsg: Message, assistantMsg: Message, conversationId: string) => void;
  onConversationId: (id: string) => void;
  onError: (message: string | null) => void;
}

export function useVoiceChat({
  conversationId,
  onMessages,
  onConversationId,
  onError
}: UseVoiceChatOptions) {
  const recorder = useAudioRecorder();
  const [status, setStatus] = useState<VoiceChatStatus>('idle');

  const toggleRecording = useCallback(async () => {
    if (status === 'processing') return;

    if (recorder.isRecording) {
      setStatus('processing');
      onError(null);

      const blob = await recorder.stopRecording();
      if (!blob || blob.size < 100) {
        setStatus('idle');
        onError('Recording too short. Try again.');
        return;
      }

      try {
        const response = await sendVoiceAudio(blob, conversationId ?? undefined);
        if (!response.success) {
          throw new Error('Voice request failed');
        }

        const { transcript, reply, conversationId: convId, detectedLanguage, audio } =
          response.data;

        const now = new Date().toISOString();
        onMessages(
          {
            id: `user-voice-${Date.now()}`,
            role: 'user',
            content: transcript,
            createdAt: now
          },
          {
            id: `ai-voice-${Date.now()}`,
            role: 'assistant',
            content: reply,
            createdAt: now
          },
          convId
        );
        onConversationId(convId);

        setStatus('speaking');
        try {
          await playReplyAudio(reply, detectedLanguage, audio);
        } catch {
          /* text reply still shown; browser may block autoplay */
        }
        setStatus('idle');
      } catch (err: unknown) {
        let message = 'Failed to process voice message';
        if (axios.isAxiosError(err)) {
          if (!err.response) {
            message = 'Cannot reach the server. Start the backend with npm run dev in the backend folder.';
          } else if (typeof err.response.data?.message === 'string') {
            message = err.response.data.message;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }
        onError(message);
        setStatus('idle');
      }
      return;
    }

    if (isPlaying()) {
      stopPlayback();
    }
    setStatus('recording');
    const started = await recorder.startRecording();
    if (!started) {
      onError(recorder.error ?? 'Microphone permission denied');
      setStatus('idle');
    }
  }, [status, recorder, conversationId, onMessages, onConversationId, onError]);

  const stopSpeaking = useCallback(() => {
    stopPlayback();
    if (status === 'speaking') setStatus('idle');
  }, [status]);

  return {
    voiceStatus: status,
    isRecording: recorder.isRecording,
    isProcessing: status === 'processing',
    isSpeaking: status === 'speaking',
    toggleRecording,
    stopSpeaking,
    recorderError: recorder.error
  };
}
