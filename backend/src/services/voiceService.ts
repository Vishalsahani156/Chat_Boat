import { AppError } from "../middleware/errorHandler";
import * as chatService from "./chatService";
import * as geminiService from "./geminiService";
import * as sttService from "./sttService";
import * as ttsService from "./ttsService";
import { prepareTextForTts } from "../utils/voiceText";
import { MessageHistory, VoiceAudioResponse } from "../types";

function isVoiceSingleCallEnabled(): boolean {
  return process.env.VOICE_SINGLE_CALL?.trim().toLowerCase() === "true";
}

export async function processVoiceAudio(
  audioBuffer: Buffer,
  mimeType: string,
  userId: string,
  conversationId?: string
): Promise<VoiceAudioResponse> {
  if (isVoiceSingleCallEnabled()) {
    let history: MessageHistory[] = [];

    if (conversationId) {
      const ctx = await chatService.resolveConversationContext(
        "voice",
        userId,
        conversationId
      );
      history = ctx.history;
    }

    const { text, language, reply } = await geminiService.processVoiceTurn(
      audioBuffer,
      mimeType,
      history
    );

    if (!text.trim()) {
      throw new AppError("Could not understand audio. Please try again.", 400);
    }

    const { convId } = await chatService.resolveConversationContext(
      text.trim(),
      userId,
      conversationId
    );

    await chatService.persistConversationTurn(convId, text.trim(), reply);

    const ttsText = prepareTextForTts(reply);
    const audio = await ttsService.synthesize(ttsText, language);

    return {
      transcript: text.trim(),
      reply,
      conversationId: convId,
      detectedLanguage: language,
      audio: audio ?? undefined,
    };
  }

  const { text, language } = await sttService.transcribe(audioBuffer, mimeType);

  if (!text.trim()) {
    throw new AppError("Could not understand audio. Please try again.", 400);
  }

  const { reply, conversationId: convId } = await chatService.processMessage(
    text.trim(),
    userId,
    conversationId,
    "voice"
  );

  const ttsText = prepareTextForTts(reply);
  const audio = await ttsService.synthesize(ttsText, language);

  return {
    transcript: text.trim(),
    reply,
    conversationId: convId,
    detectedLanguage: language,
    audio: audio ?? undefined,
  };
}
