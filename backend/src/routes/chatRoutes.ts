import { Router } from "express";
import * as chatController from "../controllers/chatController";
import { authenticate } from "../middleware/auth";
import { validateChatMessage, validateVoiceChat } from "../middleware/validation";
import { validateConversationIdParam } from "../middleware/validateParams";

const router = Router();

/** Auth per route — avoid router.use(authenticate) on /api mount (breaks fallthrough). */
const auth = authenticate;

router.post("/chat", auth, validateChatMessage, chatController.sendMessage);
router.post("/chat/stream", auth, validateChatMessage, chatController.streamMessage);
router.get("/chat/history", auth, chatController.getHistory);
router.delete("/chat/history", auth, chatController.deleteAllConversations);
router.get(
  "/chat/history/:id",
  auth,
  validateConversationIdParam,
  chatController.getConversation
);
router.post("/voice-chat", auth, validateVoiceChat, chatController.voiceChat);
router.delete(
  "/chat/history/:id",
  auth,
  validateConversationIdParam,
  chatController.deleteConversation
);

export default router;
