import { Response, NextFunction } from "express";
import * as chatService from "../services/chatService";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

function requireUserId(req: AuthenticatedRequest): string {
  if (!req.user?.userId) {
    throw new AppError("Authentication required", 401);
  }
  return req.user.userId;
}

export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const { message, conversationId } = req.body;

    const result = await chatService.processMessage(message, userId, conversationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Failed to process message",
            500
          )
    );
  }
};

function chatError(error: unknown, fallback: string): AppError {
  return error instanceof AppError
    ? error
    : new AppError(error instanceof Error ? error.message : fallback, 500);
}

export const streamMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const { message, conversationId } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    for await (const event of chatService.streamMessage(message, userId, conversationId)) {
      if (event.type === "chunk") {
        res.write(`data: ${JSON.stringify({ type: "chunk", text: event.text })}\n\n`);
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: "done",
            reply: event.reply,
            conversationId: event.conversationId,
          })}\n\n`
        );
      }
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(chatError(error, "Failed to stream message"));
      return;
    }
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Stream failed",
      })}\n\n`
    );
    res.end();
  }
};

export const getHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const conversations = await chatService.getConversations(userId);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Failed to fetch conversation history",
            500
          )
    );
  }
};

export const getConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const id = req.params.id as string;

    if (!id) {
      throw new AppError("Conversation ID is required", 400);
    }

    const conversation = await chatService.getConversation(id, userId);

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Failed to fetch conversation",
            500
          )
    );
  }
};

export const voiceChat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const { audioText, conversationId } = req.body;

    const result = await chatService.processMessage(
      audioText,
      userId,
      conversationId,
      "voice"
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Failed to process voice message",
            500
          )
    );
  }
};

export const deleteConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const id = req.params.id as string;

    if (!id) {
      throw new AppError("Conversation ID is required", 400);
    }

    const result = await chatService.deleteConversation(id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Failed to delete conversation",
            500
          )
    );
  }
};

export const deleteAllConversations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const result = await chatService.deleteAllConversations(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Failed to delete all conversations",
            500
          )
    );
  }
};
