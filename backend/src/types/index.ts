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
