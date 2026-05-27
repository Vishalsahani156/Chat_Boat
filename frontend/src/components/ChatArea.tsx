import { useRef, useEffect } from 'react';
import { Menu, Moon, Sun, VolumeX } from 'lucide-react';
import { Message } from '../types';
import { useThemeContext } from '../context/ThemeContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import WelcomeScreen from './WelcomeScreen';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  loading: boolean;
  error?: string | null;
  onToggleSidebar: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  onVoiceInput: () => void;
  onSpeak: (text: string) => void;
  onStopSpeaking: () => void;
}

export default function ChatArea({
  messages,
  onSendMessage,
  loading,
  error,
  onToggleSidebar,
  isListening,
  isSpeaking,
  onVoiceInput,
  onSpeak,
  onStopSpeaking
}: ChatAreaProps) {
  const { isDark, toggleTheme } = useThemeContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-dark-900 transition-colors duration-200">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 dark:hover:bg-dark-700 dark:text-dark-300"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-sm font-medium text-slate-800 dark:text-dark-200">
            {messages.length > 0 ? 'Chat' : 'New Chat'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="p-2 rounded-lg hover:bg-slate-100 text-red-600 dark:hover:bg-dark-700 dark:text-red-400"
              title="Stop speaking"
            >
              <VolumeX size={18} />
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 dark:hover:bg-dark-700 dark:text-dark-300 transition-colors"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <WelcomeScreen onSuggestionClick={() => inputRef.current?.focus()} />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onSpeak={onSpeak} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <ChatInput
        onSend={onSendMessage}
        loading={loading}
        onVoiceInput={onVoiceInput}
        isListening={isListening}
        ref={inputRef}
      />
    </div>
  );
}
