import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="message-fade-in flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-dark-700 border border-dark-600">
        <Bot size={16} className="text-dark-200" />
      </div>
      <div className="bg-dark-700 border border-dark-600 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce-dot" style={{ animationDelay: '0.2s' }} />
            <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce-dot" style={{ animationDelay: '0.4s' }} />
          </div>
          <span className="text-xs text-dark-400 ml-2">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
}
