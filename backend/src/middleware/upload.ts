import multer from "multer";
import { AppError } from "./errorHandler";

const MAX_BYTES = parseInt(process.env.VOICE_MAX_BYTES || "10485760", 10);

const ALLOWED_MIMES = new Set([
  "audio/webm",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/flac",
]);

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const mime = file.mimetype.split(";")[0].trim().toLowerCase();
    if (ALLOWED_MIMES.has(mime)) {
      cb(null, true);
      return;
    }
    cb(new AppError(`Unsupported audio type: ${file.mimetype}`, 400));
  },
});

export function normalizeAudioMime(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  if (base === "audio/wave" || base === "audio/x-wav") return "audio/wav";
  return base;
}
