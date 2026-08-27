-- Add optional image (data: URL) to messages so user-attached images survive reloads.
ALTER TABLE "Message" ADD COLUMN "image" TEXT;
