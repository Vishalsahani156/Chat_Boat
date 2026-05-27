import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import * as geminiService from "./geminiService";
import { ChatResponse, MessageHistory } from "../types";

export const processMessage = async (
  message: string,
  userId: string,
  conversationId?: string
): Promise<ChatResponse> => {
  let convId = conversationId;

  if (!convId) {
    const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
    const conversation = await prisma.conversation.create({
      data: { title, userId },
    });
    convId = conversation.id;
  }

  const existingConversation = await prisma.conversation.findFirst({
    where: { id: convId, userId },
  });

  if (!existingConversation) {
    throw new AppError("Conversation not found", 404);
  }

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

  const reply = await geminiService.generateResponse(message, history);

  await prisma.$transaction([
    prisma.message.create({
      data: {
        role: "user",
        content: message,
        conversationId: convId,
      },
    }),
    prisma.message.create({
      data: {
        role: "assistant",
        content: reply,
        conversationId: convId,
      },
    }),
    prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    }),
    prisma.chat.create({
      data: {
        userMessage: message,
        aiReply: reply,
      },
    }),
  ]);

  return { reply, conversationId: convId };
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
