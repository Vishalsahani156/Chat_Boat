import { useState, useRef, useEffect, KeyboardEvent, forwardRef, type ForwardedRef } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  onVoiceInput: () => void;
  isListening: boolean;
}

function setRef<T>(node: T | null, ref: ForwardedRef<T>) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

export default forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput(
  { onSend, loading, onVoiceInput, isListening },
  forwardedRef
) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="border-t border-slate-200 bg-white dark:border-dark-700 dark:bg-dark-800 p-4 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 
          dark:bg-dark-700 dark:border-dark-600 
          focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
          <button
            onClick={onVoiceInput}
            className={`shrink-0 p-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:text-dark-400 dark:hover:text-dark-200 dark:hover:bg-dark-600'
            }`}
            title={isListening ? 'Stop recording' : 'Voice input'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <textarea
            ref={node => {
              textareaRef.current = node;
              setRef(node, forwardedRef);
            }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400
              resize-none outline-none text-sm leading-relaxed py-1.5 max-h-40
              dark:text-dark-100 dark:placeholder:text-dark-400"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="shrink-0 p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600
              text-white disabled:opacity-40 disabled:cursor-not-allowed
              hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-dark-500 text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
});
