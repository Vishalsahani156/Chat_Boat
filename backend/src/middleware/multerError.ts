import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "./errorHandler";

export function handleMulterError(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(new AppError("Audio file is too large", 400));
      return;
    }
    next(new AppError(err.message, 400));
    return;
  }
  if (err instanceof AppError) {
    next(err);
    return;
  }
  if (err instanceof Error) {
    next(new AppError(err.message, 400));
    return;
  }
  next(err);
}

type MulterSingleHandler = (
  req: Request,
  res: Response,
  next: (err?: unknown) => void
) => void;

/** Wrap multer middleware so upload errors reach the error handler. */
export function wrapMulterUpload(uploadMiddleware: MulterSingleHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err?: unknown) => {
      if (err) {
        handleMulterError(err, req, res, next);
        return;
      }
      next();
    });
  };
}
