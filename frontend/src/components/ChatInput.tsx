import { useState, useRef, useEffect, KeyboardEvent, forwardRef, type ForwardedRef } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (!trimmed || loading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

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
      <div className="mx-auto max-w-3xl">
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
            disabled={!input.trim() || loading || inputDisabled}
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
