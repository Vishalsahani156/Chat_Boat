import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { AppError } from "./errorHandler";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = parseInt(process.env.VOICE_RATE_LIMIT_PER_MIN || "20", 10);

const hits = new Map<string, { count: number; resetAt: number }>();

export function voiceRateLimit(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const userId = req.user?.userId;
  if (!userId) {
    next();
    return;
  }

  const now = Date.now();
  const entry = hits.get(userId);

  if (!entry || now >= entry.resetAt) {
    hits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    next(new AppError("Too many voice requests. Please wait a moment.", 429));
    return;
  }

  entry.count += 1;
  next();
}
