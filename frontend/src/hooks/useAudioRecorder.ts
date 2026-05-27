import { useState, useCallback, useRef } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'error';

function pickMimeType(): string {
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  }
  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return 'audio/webm';
  }
  return 'audio/mp4';
}

export function useAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef('audio/webm');

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType.split(';')[0];

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      setStatus('recording');
      return true;
    } catch (err) {
      stopTracks();
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone permission denied'
          : 'Could not access microphone';
      setError(message);
      setStatus('error');
      return false;
    }
  }, [stopTracks]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        stopTracks();
        setStatus('idle');
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = chunksRef.current.length
          ? new Blob(chunksRef.current, { type: recorder.mimeType || mimeTypeRef.current })
          : null;
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        stopTracks();
        setStatus('idle');
        resolve(blob);
      };

      recorder.stop();
    });
  }, [stopTracks]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    stopTracks();
    setStatus('idle');
  }, [stopTracks]);

  const getNormalizedMime = useCallback(() => mimeTypeRef.current, []);

  return {
    status,
    isRecording: status === 'recording',
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    getNormalizedMime
  };
}
