import { Conversation, Message } from "@prisma/client";

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
}

export interface VoiceChatRequest {
  audioText: string;
  conversationId?: string;
}

export interface VoiceAudioPayload {
  mimeType: string;
  base64: string;
}

export interface VoiceAudioResponse {
  transcript: string;
  reply: string;
  conversationId: string;
  detectedLanguage: string;
  audio?: VoiceAudioPayload;
}

export interface VoiceSocketEvents {
  voiceStart: { conversationId?: string };
  voiceChunk: { data: string; mimeType?: string };
  voiceEnd: { conversationId?: string };
  voiceInterrupt: Record<string, never>;
  voiceTranscript: { text: string; language: string };
  voiceTextChunk: { chunk: string; done?: boolean };
  voiceAudioOut: { mimeType: string; base64: string; done?: boolean };
  voiceError: { message: string };
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface SocketEvents {
  newMessage: {
    conversationId: string;
    message: {
      role: string;
      content: string;
    };
  };
  error: {
    message: string;
  };
}

export interface MessageHistory {
  role: string;
  content: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
