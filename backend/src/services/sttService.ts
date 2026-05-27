import * as geminiService from "./geminiService";

export interface TranscriptionResult {
  text: string;
  language: string;
}

export async function transcribe(
  audioBuffer: Buffer,
  mimeType: string
): Promise<TranscriptionResult> {
  return geminiService.transcribeAudio(audioBuffer, mimeType);
}
