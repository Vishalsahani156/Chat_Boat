const DEFAULT_MAX_TTS_CHARS = 800;

/** Remove markdown and normalize whitespace for natural TTS. */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function prepareTextForTts(
  text: string,
  maxChars = DEFAULT_MAX_TTS_CHARS
): string {
  let cleaned = stripMarkdownForSpeech(text);
  if (cleaned.length > maxChars) {
    const cut = cleaned.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(" ");
    cleaned = (lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
  }
  return cleaned;
}
