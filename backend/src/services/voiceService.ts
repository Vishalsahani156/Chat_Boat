import { AppError } from "../middleware/errorHandler";
import * as chatService from "./chatService";
import * as sttService from "./sttService";
import * as ttsService from "./ttsService";
import { VoiceAudioResponse } from "../types";

export async function processVoiceAudio(
  audioBuffer: Buffer,
  mimeType: string,
  userId: string,
  conversationId?: string
): Promise<VoiceAudioResponse> {
  const { text, language } = await sttService.transcribe(audioBuffer, mimeType);

  if (!text.trim()) {
    throw new AppError("Could not understand audio. Please try again.", 400);
  }

  const { reply, conversationId: convId } = await chatService.processMessage(
    text.trim(),
    userId,
    conversationId
  );

  const audio = await ttsService.synthesize(reply, language);

  return {
    transcript: text.trim(),
    reply,
    conversationId: convId,
    detectedLanguage: language,
    audio: audio ?? undefined,
  };
}
