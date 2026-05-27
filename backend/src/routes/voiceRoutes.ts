import { Router } from "express";
import * as voiceController from "../controllers/voiceController";
import { authenticate } from "../middleware/auth";
import { audioUpload } from "../middleware/upload";
import { wrapMulterUpload } from "../middleware/multerError";
import { voiceRateLimit } from "../middleware/voiceRateLimit";

const router = Router();

router.use(authenticate);
router.use(voiceRateLimit);

router.post(
  "/voice/audio",
  wrapMulterUpload(audioUpload.single("audio")),
  voiceController.sendVoiceAudio
);

export default router;
