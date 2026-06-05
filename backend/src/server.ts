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
import { notFoundHandler } from "./middleware/notFound";
import * as chatService from "./services/chatService";
import { attachVoiceHandlers, cleanupVoiceSession } from "./services/geminiLiveService";
import { verifyAccessToken } from "./utils/jwt";
import { isValidUuid } from "./utils/uuid";
import { AppError } from "./middleware/errorHandler";
import { validateAuthConfig, validateGeminiConfig, isGeminiConfigured } from "./config/env";
import prisma, { connectDatabase } from "./config/database";

validateAuthConfig();
validateGeminiConfig();

/** Production default if CORS_ORIGIN is unset. */
const defaultProdOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

const localhostDevRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
/** Vercel production + preview deployments for this project (chat-boat*.vercel.app). */
const vercelChatBoatOriginRegex = /^https:\/\/chat-boat[\w-]*\.vercel\.app$/;
const isProduction = process.env.NODE_ENV === "production";

/**
 * In development, allow any localhost / 127.0.0.1 port so Vite can use 5174+ when 5173 is busy.
 * In production, use CORS_ORIGIN or defaultProdOrigins, plus Vercel chat-boat preview URLs.
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
  if (allowList.includes(origin)) return true;
  if (vercelChatBoatOriginRegex.test(origin)) return true;
  return false;
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

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "chat-boat-api",
    health: "/health",
  });
});

app.get("/health", async (_req, res) => {
  let db: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const payload = {
    status: db === "ok" ? "ok" : "degraded",
    geminiConfigured: isGeminiConfigured(),
    db,
    timestamp: new Date().toISOString(),
  };

  res.status(db === "ok" ? 200 : 503).json(payload);
});

app.use("/api/auth", authRoutes);
app.use("/api", voiceRoutes);
app.use("/api", chatRoutes);
app.use("/api", notFoundHandler);

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

      const convId =
        typeof conversationId === "string" && conversationId.trim()
          ? conversationId.trim()
          : undefined;
      if (convId && !isValidUuid(convId)) {
        socket.emit("error", { message: "Invalid conversation ID" });
        return;
      }

      const result = await chatService.processMessage(message.trim(), userId, convId);

      socket.emit("newMessage", {
        conversationId: result.conversationId,
        message: {
          role: "assistant",
          content: result.reply,
        },
      });
    } catch (error) {
      console.error("Socket message error:", error);
      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to process message";
      socket.emit("error", { message });
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

void connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch(() => {
    process.exit(1);
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
