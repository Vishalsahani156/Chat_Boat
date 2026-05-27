import { Request, Response, NextFunction } from "express";
import * as chatService from "../services/chatService";
import { AppError } from "../middleware/errorHandler";

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, conversationId } = req.body;

    const result = await chatService.processMessage(message, conversationId);

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

export const getHistory = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversations = await chatService.getConversations();

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(new AppError("Failed to fetch conversation history", 500));
  }
};

export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id) {
      throw new AppError("Conversation ID is required", 400);
    }

    const conversation = await chatService.getConversation(id);

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    const message =
      error instanceof Error && error.message === "Conversation not found"
        ? error.message
        : "Failed to fetch conversation";
    const statusCode =
      error instanceof Error && error.message === "Conversation not found" ? 404 : 500;
    next(new AppError(message, statusCode));
  }
};

export const voiceChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { audioText, conversationId } = req.body;

    const result = await chatService.processMessage(audioText, conversationId);

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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id) {
      throw new AppError("Conversation ID is required", 400);
    }

    const result = await chatService.deleteConversation(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    const message =
      error instanceof Error && error.message === "Conversation not found"
        ? error.message
        : "Failed to delete conversation";
    const statusCode =
      error instanceof Error && error.message === "Conversation not found" ? 404 : 500;
    next(new AppError(message, statusCode));
  }
};
