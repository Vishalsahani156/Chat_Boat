import { Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

export const register = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const result = await authService.registerUser(name, email, password);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Registration failed",
            500
          )
    );
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(error instanceof Error ? error.message : "Login failed", 500)
    );
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError("Authentication required", 401);
    }

    const user = await authService.getUserById(req.user.userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Failed to fetch profile",
            500
          )
    );
  }
};
