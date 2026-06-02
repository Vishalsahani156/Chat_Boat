import { useRef, useEffect } from 'react';
import { Menu, Moon, Sun, VolumeX, Sparkles } from 'lucide-react';
import { Message } from '../types';
import { useThemeContext } from '../context/ThemeContext';
import type { LiveVoiceStatus } from '../hooks/useLiveVoice';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import WelcomeScreen from './WelcomeScreen';
import VoiceMode from './VoiceMode';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  loading: boolean;
  error?: string | null;
  onToggleSidebar: () => void;
  isListening: boolean;
  isProcessing?: boolean;
  isSpeaking: boolean;
  voiceDisabled?: boolean;
  onVoiceInput: () => void;
  onSpeak: (text: string) => void;
  onStopSpeaking: () => void;
  inputDisabled?: boolean;
  liveVoiceStatus: LiveVoiceStatus;
  onLiveVoiceStart: () => void;
  onLiveVoiceStop: () => void;
  onLiveVoiceEndTurn: () => void;
  onLiveVoiceInterrupt: () => void;
  isLiveProcessing?: boolean;
  liveVoiceDisabled?: boolean;
}

export default function ChatArea({
  messages,
  onSendMessage,
  loading,
  error,
  onToggleSidebar,
  isListening,
  isProcessing = false,
  isSpeaking,
  voiceDisabled = false,
  onVoiceInput,
  onSpeak,
  onStopSpeaking,
  inputDisabled = false,
  liveVoiceStatus,
  onLiveVoiceStart,
  onLiveVoiceStop,
  onLiveVoiceEndTurn,
  onLiveVoiceInterrupt,
  isLiveProcessing = false,
  liveVoiceDisabled = false,
}: ChatAreaProps) {
  const { isDark, toggleTheme } = useThemeContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showTyping = loading || isProcessing || isLiveProcessing;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header
        className="glass-panel z-10 flex shrink-0 items-center justify-between gap-2
          border-b px-3 py-2.5 sm:px-4 sm:py-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="btn-icon md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-brand shadow-glow-sm sm:flex">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {messages.length > 0 ? 'Conversation' : 'New Chat'}
              </h2>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {messages.length > 0 ? `${messages.length} messages` : 'Start a new conversation'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <VoiceMode
            status={liveVoiceStatus}
            disabled={liveVoiceDisabled}
            onStart={onLiveVoiceStart}
            onStop={onLiveVoiceStop}
            onEndTurn={onLiveVoiceEndTurn}
            onInterrupt={onLiveVoiceInterrupt}
          />
          {isSpeaking && (
            <button
              type="button"
              onClick={onStopSpeaking}
              className="btn-icon !text-red-500 dark:!text-red-400"
              title="Stop speaking"
              aria-label="Stop speaking"
            >
              <VolumeX size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-icon"
            title={isDark ? 'Light mode' : 'Dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {error && (
        <div
          className="mx-3 mt-3 shrink-0 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm
            text-red-800 backdrop-blur-sm animate-fade-in
            dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 sm:mx-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {messages.length === 0 && !showTyping ? (
        <WelcomeScreen
          onSuggestionClick={(prompt) => {
            onSendMessage(prompt);
          }}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-6">
          <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onSpeak={onSpeak} />
            ))}
            {showTyping && <TypingIndicator />}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      )}

      <ChatInput
        onSend={onSendMessage}
        loading={loading || isProcessing}
        onVoiceInput={onVoiceInput}
        isListening={isListening}
        isProcessing={isProcessing}
        voiceDisabled={voiceDisabled}
        inputDisabled={inputDisabled}
        ref={inputRef}
      />
    </div>
  );
}
