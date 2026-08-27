import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, forwardRef, type ForwardedRef } from 'react';
import { Send, Mic, MicOff, Loader2, Image as ImageIcon, Smile, X } from 'lucide-react';
import { ImageInput } from '../types';
import { fileToInlineImage, MAX_IMAGE_BYTES } from '../utils/image';

const EMOJIS = [
  '😀', '😂', '🙂', '😉', '😍', '😘', '😎', '🤔', '😴', '😇',
  '👍', '👎', '👏', '🙏', '💪', '🔥', '✨', '🎉', '❤️', '💯',
  '😢', '😭', '😡', '🥳', '😅', '🤩', '😱', '🤝', '👀', '🙌',
  '✅', '❌', '⭐', '💡', '📌', '⚡', '🚀', '🎯', '💬', '📷',
];

interface ChatInputProps {
  onSend: (message: string, image?: ImageInput, imagePreview?: string) => void;
  loading: boolean;
  onVoiceInput: () => void;
  isListening: boolean;
  isProcessing?: boolean;
  voiceDisabled?: boolean;
  inputDisabled?: boolean;
  prefillText?: string;
  prefillKey?: number;
}

function setRef<T>(node: T | null, ref: ForwardedRef<T>) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

export default forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput(
  {
    onSend,
    loading,
    onVoiceInput,
    isListening,
    isProcessing = false,
    voiceDisabled = false,
    inputDisabled = false,
    prefillText,
    prefillKey,
  },
  forwardedRef
) {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ payload: ImageInput; dataUrl: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefillKey !== undefined && prefillText !== undefined) {
      setInput(prefillText);
      textareaRef.current?.focus();
    }
  }, [prefillKey, prefillText]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && !image) || loading) return;
    onSend(trimmed, image?.payload, image?.dataUrl);
    setInput('');
    setImage(null);
    setImageError(null);
    setShowEmoji(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image is too large (max 8 MB).');
      return;
    }
    try {
      const { image: payload, dataUrl } = await fileToInlineImage(file);
      setImage({ payload, dataUrl });
    } catch {
      setImageError('Could not read that image. Try another.');
    }
  };

  const insertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  // Close the emoji picker on Escape (outside-click is handled by the backdrop below).
  useEffect(() => {
    if (!showEmoji) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setShowEmoji(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showEmoji]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="shrink-0 border-t border-slate-200/80 bg-white/80 px-3 py-3 backdrop-blur-xl
        pb-[max(0.75rem,env(safe-area-inset-bottom))]
        dark:border-white/[0.06] dark:bg-dark-900/80 sm:px-4 sm:py-4"
    >
      <div className="relative mx-auto max-w-3xl">
        {imageError && (
          <p className="mb-2 text-center text-xs text-red-500">{imageError}</p>
        )}

        {image && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5 dark:border-white/10 dark:bg-dark-800/60">
            <img src={image.dataUrl} alt="attachment preview" className="h-14 w-14 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="btn-icon !min-h-[32px] !min-w-[32px] !rounded-lg"
              title="Remove image"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {showEmoji && (
          <button
            type="button"
            aria-label="Close emoji picker"
            onClick={() => setShowEmoji(false)}
            className="fixed inset-0 z-[5] cursor-default"
          />
        )}

        {showEmoji && (
          <div
            className="absolute bottom-full left-0 z-10 mb-2 grid w-[min(20rem,90vw)] grid-cols-8 gap-1
              rounded-2xl border border-slate-200/80 bg-white p-2 shadow-soft
              dark:border-white/10 dark:bg-dark-800"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="rounded-lg p-1 text-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />

        <div
          className={`flex items-end gap-1.5 rounded-2xl border p-1.5 transition-all duration-200 sm:gap-2 sm:rounded-3xl sm:p-2 ${
            isListening
              ? 'border-red-400/50 bg-red-50/50 ring-2 ring-red-500/20 dark:border-red-500/30 dark:bg-red-500/5'
              : 'border-slate-200/80 bg-slate-50/80 focus-within:border-brand-400/60 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-white/10 dark:bg-dark-800/60 dark:focus-within:border-brand-500/40'
          }`}
        >
          <button
            type="button"
            onClick={onVoiceInput}
            disabled={voiceDisabled || loading}
            className={`btn-icon shrink-0 !min-h-[44px] !min-w-[44px] !rounded-xl ${
              isListening || isProcessing
                ? '!bg-red-500/15 !text-red-600 dark:!text-red-400'
                : ''
            }`}
            title={
              isProcessing
                ? 'Processing voice...'
                : isListening
                  ? 'Stop recording'
                  : 'Voice input'
            }
            aria-label={isListening ? 'Stop recording' : 'Voice input'}
          >
            {isListening || isProcessing ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || inputDisabled}
            className="btn-icon shrink-0 !min-h-[44px] !min-w-[44px] !rounded-xl"
            title="Attach image"
            aria-label="Attach image"
          >
            <ImageIcon size={20} />
          </button>

          <button
            type="button"
            onClick={() => setShowEmoji((s) => !s)}
            disabled={inputDisabled}
            className={`btn-icon shrink-0 !min-h-[44px] !min-w-[44px] !rounded-xl ${
              showEmoji ? '!bg-brand-500/15 !text-brand-600 dark:!text-brand-300' : ''
            }`}
            title="Emoji"
            aria-label="Emoji"
          >
            <Smile size={20} />
          </button>

          <textarea
            ref={(node) => {
              textareaRef.current = node;
              setRef(node, forwardedRef);
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={inputDisabled}
            placeholder={
              isListening
                ? 'Listening… tap mic to stop'
                : isProcessing
                  ? 'Processing voice…'
                  : 'Message AI Chatbot…'
            }
            rows={1}
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-base leading-relaxed
              text-slate-900 outline-none placeholder:text-slate-400
              dark:text-slate-100 dark:placeholder:text-slate-500
              disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={(!input.trim() && !image) || loading || inputDisabled}
            className="btn-primary shrink-0 !min-h-[44px] !min-w-[44px] !rounded-xl !px-0 sm:!min-w-[48px]"
            aria-label="Send message"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="mt-2 hidden text-center text-[11px] text-slate-400 sm:block dark:text-slate-500">
          Enter to send · Mic for voice · Live voice in header
        </p>
      </div>
    </div>
  );
});
