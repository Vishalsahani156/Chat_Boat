import { param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateConversationIdParam = [
  param("id")
    .isUUID()
    .withMessage("Invalid conversation ID"),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg ?? "Invalid conversation ID",
      });
      return;
    }
    next();
  },
];
