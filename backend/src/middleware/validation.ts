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

const optionalConversationId = body("conversationId")
  .optional({ values: "null" })
  .isString()
  .withMessage("conversationId must be a string")
  .trim()
  .notEmpty()
  .withMessage("conversationId cannot be empty")
  .isUUID()
  .withMessage("Invalid conversation ID");

export const validateChatMessage = [
  body("message")
    .exists({ checkFalsy: true })
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string")
    .trim()
    .notEmpty()
    .withMessage("Message cannot be empty"),
  optionalConversationId,
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
  optionalConversationId,
  handleValidationErrors,
];

export const validateRegister = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Username is required")
    .isString()
    .withMessage("Username must be a string")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ max: 12 })
    .withMessage("Username cannot exceed 12 characters")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("Username can only contain letters and numbers"),
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .isLength({ max: 50 })
    .withMessage("Please add short email")
    .normalizeEmail(),
  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password is required")
    .bail()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters")
    .bail()
    .isLength({ max: 8 })
    .withMessage("Password cannot exceed 8 characters"),
  handleValidationErrors,
];

const handleLoginValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const mapped = errors.mapped();
    const emailInvalid = "email" in mapped;
    const passwordInvalid = "password" in mapped;

    let message: string;
    if (emailInvalid && passwordInvalid) {
      message = "Invalid email | Invalid password";
    } else if (emailInvalid) {
      message = mapped.email?.msg ?? "Invalid email";
    } else if (passwordInvalid) {
      message = mapped.password?.msg ?? "Invalid password";
    } else {
      message = errors.array()[0]?.msg ?? "Validation failed";
    }

    res.status(400).json({ success: false, message });
    return;
  }
  next();
};

export const validateLogin = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Invalid email")
    .trim()
    .isEmail()
    .withMessage("Invalid email")
    .isLength({ max: 50 })
    .withMessage("Please add short email")
    .normalizeEmail(),
  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password is required")
    .bail()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters")
    .bail()
    .isLength({ max: 8 })
    .withMessage("Password cannot exceed 8 characters"),
  handleLoginValidationErrors,
];
