import { useState, useCallback, useRef, useEffect } from 'react';
import { connectSocket, getSocket } from '../services/socket';
import { arrayBufferToBase64 } from '../utils/base64';
import { getToken } from '../services/api';
import { playReplyAudio, stopPlayback } from '../utils/audioPlayback';
import { useAudioRecorder } from './useAudioRecorder';

export type LiveVoiceStatus = 'off' | 'listening' | 'processing' | 'speaking';

interface UseLiveVoiceOptions {
  conversationId: string | null;
  onTranscript: (text: string, language: string) => void;
  onAssistantChunk: (chunk: string, done: boolean) => void;
  onAssistantDone: (reply: string, conversationId: string) => void;
  onError: (message: string | null) => void;
}

async function waitForSocketConnection(socket: ReturnType<typeof getSocket>): Promise<boolean> {
  if (!socket) return false;
  if (socket.connected) return true;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      resolve(false);
    }, 5000);

    const onConnect = () => {
      clearTimeout(timeout);
      socket.off('connect_error', onError);
      resolve(true);
    };

    const onError = () => {
      clearTimeout(timeout);
      socket.off('connect', onConnect);
      resolve(false);
    };

    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
  });
}

export function useLiveVoice({
  conversationId,
  onTranscript,
  onAssistantChunk,
  onAssistantDone,
  onError
}: UseLiveVoiceOptions) {
  const [status, setStatus] = useState<LiveVoiceStatus>('off');
  const recorder = useAudioRecorder();
  const activeRef = useRef(false);
  const partialReplyRef = useRef('');
  const receivedServerAudioRef = useRef(false);
  const detectedLanguageRef = useRef('en');

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    connectSocket(token);
    const socket = getSocket();
    if (!socket) return;

    const onTranscriptEvt = (data: { text: string; language?: string }) => {
      if (data.language) detectedLanguageRef.current = data.language;
      onTranscript(data.text, detectedLanguageRef.current);
      setStatus('processing');
    };

    const onTextChunk = (data: { chunk: string; done?: boolean }) => {
      if (data.chunk) {
        partialReplyRef.current += data.chunk;
        onAssistantChunk(data.chunk, false);
      }
      if (data.done) {
        onAssistantChunk('', true);
      }
    };

    const onAudioOut = async (data: { mimeType: string; base64: string }) => {
      receivedServerAudioRef.current = true;
      setStatus('speaking');
      const text = partialReplyRef.current;
      partialReplyRef.current = '';
      await playReplyAudio(text, detectedLanguageRef.current, {
        mimeType: data.mimeType,
        base64: data.base64
      });
      if (activeRef.current) {
        setStatus('listening');
        const ok = await recorder.startRecording();
        if (!ok) onError(recorder.error ?? 'Microphone unavailable');
      } else {
        setStatus('off');
      }
    };

    const onNewMessage = async (data: {
      conversationId: string;
      message: { role: string; content: string };
    }) => {
      if (data.message.role !== 'assistant') return;
      onAssistantDone(data.message.content, data.conversationId);
      if (!receivedServerAudioRef.current && data.message.content) {
        setStatus('speaking');
        await playReplyAudio(data.message.content, detectedLanguageRef.current);
        if (activeRef.current) {
          setStatus('listening');
          const ok = await recorder.startRecording();
          if (!ok) onError(recorder.error ?? 'Microphone unavailable');
        } else {
          setStatus('off');
        }
      }
      receivedServerAudioRef.current = false;
    };

    const onVoiceError = (data: { message: string }) => {
      onError(data.message);
      activeRef.current = false;
      recorder.cancelRecording();
      setStatus('off');
      partialReplyRef.current = '';
      receivedServerAudioRef.current = false;
    };

    socket.on('voiceTranscript', onTranscriptEvt);
    socket.on('voiceTextChunk', onTextChunk);
    socket.on('voiceAudioOut', onAudioOut);
    socket.on('newMessage', onNewMessage);
    socket.on('voiceError', onVoiceError);

    return () => {
      socket.off('voiceTranscript', onTranscriptEvt);
      socket.off('voiceTextChunk', onTextChunk);
      socket.off('voiceAudioOut', onAudioOut);
      socket.off('newMessage', onNewMessage);
      socket.off('voiceError', onVoiceError);
    };
  }, [onTranscript, onAssistantChunk, onAssistantDone, onError, recorder]);

  const startLiveMode = useCallback(async () => {
    const token = getToken();
    if (!token) {
      onError('Not authenticated');
      return;
    }

    connectSocket(token);
    const socket = getSocket();
    const connected = await waitForSocketConnection(socket);
    if (!connected) {
      onError('Could not connect for live voice');
      return;
    }

    activeRef.current = true;
    partialReplyRef.current = '';
    receivedServerAudioRef.current = false;
    detectedLanguageRef.current = 'en';
    onError(null);
    stopPlayback();

    socket?.emit('voiceStart', { conversationId: conversationId ?? undefined });
    setStatus('listening');

    const ok = await recorder.startRecording();
    if (!ok) {
      activeRef.current = false;
      setStatus('off');
      onError(recorder.error ?? 'Microphone permission denied');
      socket?.emit('voiceInterrupt');
    }
  }, [conversationId, onError, recorder]);

  const endLiveMode = useCallback(async () => {
    stopPlayback();

    const socket = getSocket();
    let blob: Blob | null = null;

    if (recorder.isRecording) {
      blob = await recorder.stopRecording();
    } else {
      recorder.cancelRecording();
    }

    if (!blob || blob.size < 100) {
      onError('Recording too short. Try again.');
      if (activeRef.current) {
        setStatus('listening');
        const ok = await recorder.startRecording();
        if (!ok) onError(recorder.error ?? 'Microphone unavailable');
      } else {
        setStatus('off');
      }
      return;
    }

    if (socket?.connected) {
      const buffer = await blob.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const mime = blob.type || recorder.getNormalizedMime() || 'audio/webm';
      socket.emit('voiceChunk', { data: base64, mimeType: mime });
      socket.emit('voiceEnd');
      setStatus('processing');
    } else {
      onError('Connection lost. Please try again.');
      setStatus('off');
    }
  }, [recorder, onError]);

  const interrupt = useCallback(async () => {
    stopPlayback();
    getSocket()?.emit('voiceInterrupt');
    partialReplyRef.current = '';
    receivedServerAudioRef.current = false;
    if (activeRef.current) {
      setStatus('listening');
      if (!recorder.isRecording) {
        const ok = await recorder.startRecording();
        if (!ok) onError(recorder.error ?? 'Microphone unavailable');
      }
    }
  }, [recorder, onError]);

  const stopLiveMode = useCallback(async () => {
    activeRef.current = false;
    getSocket()?.emit('voiceInterrupt');
    recorder.cancelRecording();
    setStatus('off');
    stopPlayback();
  }, [recorder]);

  return {
    status,
    isActive: status !== 'off',
    startLiveMode,
    endLiveMode,
    stopLiveMode,
    interrupt
  };
}
