import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import chatRoutes from "./routes/chatRoutes";
import { errorHandler } from "./middleware/errorHandler";
import * as chatService from "./services/chatService";

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", chatRoutes);

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("sendMessage", async (data: { message: string; conversationId?: string }) => {
    try {
      const { message, conversationId } = data;

      if (!message || typeof message !== "string" || !message.trim()) {
        socket.emit("error", { message: "Message is required and must be a non-empty string" });
        return;
      }

      const result = await chatService.processMessage(message.trim(), conversationId);

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
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = parseInt(process.env.PORT || "5000", 10);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed");
    io.close(() => {
      console.log("Socket.IO server closed");
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
