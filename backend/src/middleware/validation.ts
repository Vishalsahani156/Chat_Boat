import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const validateChatMessage = [
  body("message")
    .exists({ checkFalsy: true })
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string")
    .trim()
    .notEmpty()
    .withMessage("Message cannot be empty"),
  handleValidationErrors,
];

export const validateVoiceChat = [
  body("audioText")
    .exists({ checkFalsy: true })
    .withMessage("Audio text is required")
    .isString()
    .withMessage("Audio text must be a string")
    .trim()
    .notEmpty()
    .withMessage("Audio text cannot be empty"),
  handleValidationErrors,
];
