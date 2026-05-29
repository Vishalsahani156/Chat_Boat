import { Socket } from "socket.io";
import * as sttService from "./sttService";
import * as ttsService from "./ttsService";
import * as geminiService from "./geminiService";
import prisma from "../config/database";
import { MessageHistory } from "../types";
import { normalizeAudioMime } from "../middleware/upload";
import { isValidUuid } from "../utils/uuid";

interface LiveSession {
  userId: string;
  conversationId?: string;
  chunks: Buffer[];
  mimeType: string;
  interrupted: boolean;
}

const sessions = new Map<string, LiveSession>();
/** Tracks in-flight live processing so voiceInterrupt can cancel it. */
const abortedSockets = new Set<string>();

export function startSession(
  socketId: string,
  userId: string,
  conversationId?: string
): void {
  abortedSockets.delete(socketId);
  sessions.set(socketId, {
    userId,
    conversationId,
    chunks: [],
    mimeType: "audio/webm",
    interrupted: false,
  });
}

export function appendChunk(
  socketId: string,
  data: string,
  mimeType?: string
): void {
  const session = sessions.get(socketId);
  if (!session || session.interrupted) return;
  session.chunks.push(Buffer.from(data, "base64"));
  if (mimeType) session.mimeType = normalizeAudioMime(mimeType);
}

export function interruptSession(socketId: string): void {
  abortedSockets.add(socketId);
  const session = sessions.get(socketId);
  if (session) session.interrupted = true;
  sessions.delete(socketId);
}

function isAborted(socketId: string): boolean {
  return abortedSockets.has(socketId);
}

export function endSession(socket: Socket): void {
  const session = sessions.get(socket.id);
  if (!session) return;
  sessions.delete(socket.id);

  if (session.interrupted || session.chunks.length === 0) {
    return;
  }

  void processLiveSession(socket, session);
}

async function processLiveSession(socket: Socket, session: LiveSession): Promise<void> {
  const socketId = socket.id;
  try {
    if (isAborted(socketId)) return;

    const audioBuffer = Buffer.concat(session.chunks);
    const mimeType = session.mimeType;

    const { text, language } = await sttService.transcribe(audioBuffer, mimeType);
    if (isAborted(socketId)) return;
    if (!text.trim()) {
      socket.emit("voiceError", { message: "Could not understand audio." });
      return;
    }

    socket.emit("voiceTranscript", { text: text.trim(), language });

    let convId = session.conversationId;
    if (!convId) {
      const title = text.length > 50 ? `${text.substring(0, 50)}...` : text;
      const conversation = await prisma.conversation.create({
        data: { title, userId: session.userId },
      });
      convId = conversation.id;
    } else {
      const existing = await prisma.conversation.findFirst({
        where: { id: convId, userId: session.userId },
      });
      if (!existing) {
        socket.emit("voiceError", { message: "Conversation not found" });
        return;
      }
    }

    const previousMessages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: { role: true, content: true },
    });

    const history: MessageHistory[] = previousMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let fullReply = "";
    for await (const chunk of geminiService.generateResponseStream(text.trim(), history)) {
      if (isAborted(socketId)) return;
      fullReply += chunk;
      socket.emit("voiceTextChunk", { chunk, done: false });
    }

    if (isAborted(socketId)) return;

    socket.emit("voiceTextChunk", { chunk: "", done: true });

    if (!fullReply.trim()) {
      socket.emit("voiceError", { message: "Empty response from AI" });
      return;
    }

    await prisma.$transaction([
      prisma.message.create({
        data: { role: "user", content: text.trim(), conversationId: convId },
      }),
      prisma.message.create({
        data: { role: "assistant", content: fullReply, conversationId: convId },
      }),
      prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      }),
      prisma.chat.create({
        data: { userMessage: text.trim(), aiReply: fullReply },
      }),
    ]);

    const audio = await ttsService.synthesize(fullReply, language);
    if (audio) {
      socket.emit("voiceAudioOut", {
        mimeType: audio.mimeType,
        base64: audio.base64,
        done: true,
      });
    }

    socket.emit("newMessage", {
      conversationId: convId,
      message: { role: "assistant", content: fullReply },
    });
  } catch (error) {
    if (isAborted(socketId)) return;
    console.error("Live voice session error:", error);
    socket.emit("voiceError", {
      message: error instanceof Error ? error.message : "Voice session failed",
    });
  } finally {
    abortedSockets.delete(socketId);
  }
}

export function attachVoiceHandlers(socket: Socket): void {
  socket.on("voiceStart", (data: { conversationId?: string }) => {
    const userId = socket.data.userId as string;
    const conversationId = data?.conversationId?.trim();
    if (conversationId && !isValidUuid(conversationId)) {
      socket.emit("voiceError", { message: "Invalid conversation ID" });
      return;
    }
    startSession(socket.id, userId, conversationId || undefined);
  });

  socket.on("voiceChunk", (data: { data: string; mimeType?: string }) => {
    if (data?.data) appendChunk(socket.id, data.data, data.mimeType);
  });

  socket.on("voiceEnd", () => {
    endSession(socket);
  });

  socket.on("voiceInterrupt", () => {
    interruptSession(socket.id);
  });
}

export function cleanupVoiceSession(socketId: string): void {
  abortedSockets.add(socketId);
  sessions.delete(socketId);
}
