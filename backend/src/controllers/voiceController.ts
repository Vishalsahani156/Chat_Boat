import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { normalizeAudioMime } from "../middleware/upload";
import * as voiceService from "../services/voiceService";

function requireUserId(req: AuthenticatedRequest): string {
  if (!req.user?.userId) {
    throw new AppError("Authentication required", 401);
  }
  return req.user.userId;
}

export const sendVoiceAudio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const file = req.file;

    if (!file || !file.buffer?.length) {
      throw new AppError("Audio file is required", 400);
    }

    if (file.buffer.length < 100) {
      throw new AppError("Recording too short. Please try again.", 400);
    }

    const conversationId =
      typeof req.body.conversationId === "string" && req.body.conversationId.trim()
        ? req.body.conversationId.trim()
        : undefined;

    const mimeType = normalizeAudioMime(file.mimetype);
    const result = await voiceService.processVoiceAudio(
      file.buffer,
      mimeType,
      userId,
      conversationId
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
