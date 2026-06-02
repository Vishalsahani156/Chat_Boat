import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="message-fade-in flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 border border-slate-300 dark:bg-dark-700 dark:border-dark-600">
        <Bot size={16} className="text-slate-700 dark:text-dark-200" />
      </div>
      <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 dark:bg-dark-700 dark:border-dark-600">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-dot dark:bg-dark-300" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-dot dark:bg-dark-300" style={{ animationDelay: '0.2s' }} />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-dot dark:bg-dark-300" style={{ animationDelay: '0.4s' }} />
          </div>
          <span className="text-xs text-slate-500 ml-2 dark:text-dark-400">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
}
