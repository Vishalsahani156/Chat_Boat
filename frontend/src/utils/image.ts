import { ImageInput } from '../types';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB pre-resize guard

/**
 * Read an image file, downscale to `maxDim` on the long edge, and re-encode as JPEG.
 * Keeps uploads small enough for the API's 10 MB JSON limit and Gemini vision.
 * Returns the base64 payload for the API plus a data URL for local preview/render.
 */
export async function fileToInlineImage(
  file: File,
  maxDim = 1024
): Promise<{ image: ImageInput; dataUrl: string }> {
  const sourceUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not load image'));
    el.src = sourceUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Canvas unavailable (rare). Sending the un-resized original could blow the API's
    // 10 MB limit, so surface an error instead of silently defeating the size guard.
    throw new Error('Image processing is not supported in this browser.');
  }
  ctx.drawImage(img, 0, 0, w, h);
  const outUrl = canvas.toDataURL('image/jpeg', 0.85);
  return {
    image: { mimeType: 'image/jpeg', data: outUrl.split(',')[1] },
    dataUrl: outUrl,
  };
}
