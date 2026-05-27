import prisma from "../config/database";
import * as geminiService from "./geminiService";
import { ChatResponse, MessageHistory } from "../types";

export const processMessage = async (
  message: string,
  conversationId?: string
): Promise<ChatResponse> => {
  let convId = conversationId;

  if (!convId) {
    const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
    const conversation = await prisma.conversation.create({
      data: { title },
    });
    convId = conversation.id;
  }

  const existingConversation = await prisma.conversation.findUnique({
    where: { id: convId },
  });

  if (!existingConversation) {
    throw new Error("Conversation not found");
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

export const getConversations = async () => {
  const conversations = await prisma.conversation.findMany({
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

export const getConversation = async (id: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
};

export const deleteConversation = async (id: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  await prisma.conversation.delete({
    where: { id },
  });

  return { message: "Conversation deleted successfully" };
};

export const deleteAllConversations = async () => {
  const [conversationResult, chatResult] = await prisma.$transaction([
    prisma.conversation.deleteMany(),
    prisma.chat.deleteMany(),
  ]);

  return {
    message: "All conversations deleted successfully",
    deletedCount: conversationResult.count,
    deletedChatLogs: chatResult.count,
  };
};
