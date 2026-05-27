import { Router } from "express";
import * as chatController from "../controllers/chatController";
import { validateChatMessage, validateVoiceChat } from "../middleware/validation";

const router = Router();

router.post("/chat", validateChatMessage, chatController.sendMessage);
router.get("/chat/history", chatController.getHistory);
router.delete("/chat/history", chatController.deleteAllConversations);
router.get("/chat/history/:id", chatController.getConversation);
router.post("/voice-chat", validateVoiceChat, chatController.voiceChat);
router.delete("/chat/history/:id", chatController.deleteConversation);

export default router;
