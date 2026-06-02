import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="message-fade-in flex gap-2.5 sm:gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80
          bg-white shadow-soft dark:border-white/10 dark:bg-dark-800 sm:h-10 sm:w-10"
      >
        <Bot size={16} className="text-brand-600 dark:text-brand-300" />
      </div>
      <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 sm:rounded-3xl">
        <div className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full bg-brand-500 animate-bounce-dot dark:bg-brand-400"
            style={{ animationDelay: '0s' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-brand-500 animate-bounce-dot dark:bg-brand-400"
            style={{ animationDelay: '0.15s' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-brand-500 animate-bounce-dot dark:bg-brand-400"
            style={{ animationDelay: '0.3s' }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 animate-pulse-soft dark:text-slate-400">
          AI is thinking…
        </span>
      </div>
    </div>
  );
}
