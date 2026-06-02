import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function prismaToAppError(err: Prisma.PrismaClientKnownRequestError): AppError | null {
  if (err.code === "P2025") {
    return new AppError("Record not found", 404);
  }
  if (err.code === "P2002") {
    return new AppError("A record with this value already exists", 409);
  }
  return null;
}

function isJsonParseError(err: Error): boolean {
  if (!(err instanceof SyntaxError)) return false;
  const parseErr = err as SyntaxError & { status?: number; type?: string };
  return parseErr.status === 400 || parseErr.type === "entity.parse.failed";
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (isJsonParseError(err)) {
    res.status(400).json({ success: false, message: "Invalid JSON body" });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = prismaToAppError(err);
    if (mapped) {
      res.status(mapped.statusCode).json({ success: false, message: mapped.message });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: "Invalid request data",
      ...(process.env.NODE_ENV === "development" && { detail: err.message }),
    });
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";
  const includeStack =
    process.env.NODE_ENV === "development" &&
    statusCode >= 500 &&
    !(err instanceof AppError);

  res.status(statusCode).json({
    success: false,
    message,
    ...(includeStack && { stack: err.stack }),
  });
};
