import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import chatRoutes from "./routes/chatRoutes";
import authRoutes from "./routes/authRoutes";
import voiceRoutes from "./routes/voiceRoutes";
import { errorHandler } from "./middleware/errorHandler";
import * as chatService from "./services/chatService";
import { attachVoiceHandlers, cleanupVoiceSession } from "./services/geminiLiveService";
import { verifyAccessToken } from "./utils/jwt";
import { validateAuthConfig } from "./config/env";
import prisma from "./config/database";

validateAuthConfig();

/** Production default if CORS_ORIGIN is unset. */
const defaultProdOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

const localhostDevRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const isProduction = process.env.NODE_ENV === "production";

/**
 * In development, allow any localhost / 127.0.0.1 port so Vite can use 5174+ when 5173 is busy.
 * In production, use CORS_ORIGIN or defaultProdOrigins.
 */
function isOriginAllowed(origin: string | undefined): boolean {
  const configured =
    process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  if (!origin) {
    return !isProduction;
  }

  if (!isProduction) {
    if (localhostDevRegex.test(origin)) return true;
    if (configured.length > 0 && configured.includes(origin)) return true;
    return false;
  }

  const allowList = configured.length > 0 ? configured : defaultProdOrigins;
  return allowList.includes(origin);
}

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api", voiceRoutes);
app.use("/api", chatRoutes);

app.use(errorHandler);

io.use((socket, next) => {
  try {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    const payload = verifyAccessToken(token);
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  attachVoiceHandlers(socket);

  socket.on("sendMessage", async (data: { message: string; conversationId?: string }) => {
    try {
      const userId = socket.data.userId as string;
      const { message, conversationId } = data;

      if (!message || typeof message !== "string" || !message.trim()) {
        socket.emit("error", { message: "Message is required and must be a non-empty string" });
        return;
      }

      const result = await chatService.processMessage(message.trim(), userId, conversationId);

      socket.emit("newMessage", {
        conversationId: result.conversationId,
        message: {
          role: "assistant",
          content: result.reply,
        },
      });
    } catch (error) {
      console.error("Socket message error:", error);
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to process message",
      });
    }
  });

  socket.on("disconnect", () => {
    cleanupVoiceSession(socket.id);
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = parseInt(process.env.PORT || "5000", 10);

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use. Run "npm run dev" again (it frees the port first), or stop another backend/Docker container on :${PORT}.`
    );
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed");
    io.close(async () => {
      console.log("Socket.IO server closed");
      await prisma.$disconnect();
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { app, server, io };
