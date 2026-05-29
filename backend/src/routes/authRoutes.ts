import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validateLogin, validateRegister } from "../middleware/validation";
import { notFoundHandler } from "../middleware/notFound";

const router = Router();

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/me", authenticate, authController.getMe);
router.use(notFoundHandler);

export default router;
