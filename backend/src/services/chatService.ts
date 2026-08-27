import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import * as geminiService from "./geminiService";
import type { ResponseMode } from "./geminiService";
import { ChatResponse, MessageHistory } from "../types";

async function ensureConversationId(
  message: string,
  userId: string,
  conversationId?: string
): Promise<string> {
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (existing) return existing.id;
  }

  const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
  const conversation = await prisma.conversation.create({
    data: { title, userId },
  });
  return conversation.id;
}

export async function resolveConversationContext(
  message: string,
  userId: string,
  conversationId?: string
): Promise<{ convId: string; history: MessageHistory[] }> {
  const convId = await ensureConversationId(message, userId, conversationId);

  const previousMessages = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: { role: true, content: true },
  });

  const history: MessageHistory[] = previousMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  return { convId, history };
}

export async function persistConversationTurn(
  convId: string,
  userMessage: string,
  assistantReply: string
): Promise<void> {
  await prisma.$transaction([
    prisma.message.create({
      data: {
        role: "user",
        content: userMessage,
        conversationId: convId,
      },
    }),
    prisma.message.create({
      data: {
        role: "assistant",
        content: assistantReply,
        conversationId: convId,
      },
    }),
    prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    }),
    prisma.chat.create({
      data: {
        userMessage,
        aiReply: assistantReply,
      },
    }),
  ]);
}

export const processMessage = async (
  message: string,
  userId: string,
  conversationId?: string,
  mode: ResponseMode = "text",
  image?: geminiService.InlineImage
): Promise<ChatResponse> => {
  // When only an image is sent, give the model (and the stored history) a sensible prompt.
  const text = message?.trim() || (image ? "What is in this image?" : message);

  const { convId, history } = await resolveConversationContext(
    text,
    userId,
    conversationId
  );

  const reply = await geminiService.generateResponse(text, history, mode, image);

  await persistConversationTurn(convId, text, reply);

  return { reply, conversationId: convId };
};

export const streamMessage = async function* (
  message: string,
  userId: string,
  conversationId?: string
): AsyncGenerator<{ type: "chunk"; text: string } | { type: "done"; reply: string; conversationId: string }> {
  const convId = await ensureConversationId(message, userId, conversationId);

  const previousMessages = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: { role: true, content: true },
  });

  const history: MessageHistory[] = previousMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  let fullReply = "";
  for await (const chunk of geminiService.generateResponseStream(message, history)) {
    fullReply += chunk;
    yield { type: "chunk", text: chunk };
  }

  await prisma.$transaction([
    prisma.message.create({
      data: { role: "user", content: message, conversationId: convId },
    }),
    prisma.message.create({
      data: { role: "assistant", content: fullReply, conversationId: convId },
    }),
    prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    }),
    prisma.chat.create({
      data: { userMessage: message, aiReply: fullReply },
    }),
  ]);

  yield { type: "done", reply: fullReply, conversationId: convId };
};

export const getConversations = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    title: conv.title,
    messageCount: conv._count.messages,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  }));
};

export const getConversation = async (id: string, userId: string) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  return conversation;
};

export const deleteConversation = async (id: string, userId: string) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  await prisma.conversation.delete({
    where: { id },
  });

  return { message: "Conversation deleted successfully" };
};

export const deleteAllConversations = async (userId: string) => {
  const conversationResult = await prisma.conversation.deleteMany({ where: { userId } });

  return {
    message: "All conversations deleted successfully",
    deletedCount: conversationResult.count,
  };
};
