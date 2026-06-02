import { Bot, User, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  onSpeak: (text: string) => void;
}

export default function MessageBubble({ message, onSpeak }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`message-fade-in flex gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
          isUser
            ? 'bg-gradient-brand shadow-glow-sm ring-2 ring-white/20 dark:ring-white/10'
            : 'border border-slate-200/80 bg-white shadow-soft dark:border-white/10 dark:bg-dark-800'
        }`}
      >
        {isUser ? (
          <User size={17} className="text-white" />
        ) : (
          <Bot size={17} className="text-brand-600 dark:text-brand-300" />
        )}
      </div>

      <div
        className={`flex min-w-0 max-w-[min(85%,calc(100vw-5rem))] flex-col sm:max-w-[78%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`rounded-2xl px-3.5 py-2.5 sm:rounded-3xl sm:px-4 sm:py-3 ${
            isUser
              ? 'bg-gradient-brand text-white shadow-glow-sm'
              : 'glass-card border-slate-200/60 dark:border-white/[0.08]'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap sm:text-[0.9375rem]">
              {message.content}
            </p>
          ) : (
            <div
              className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-800
                prose-p:my-1.5 prose-headings:font-semibold prose-headings:text-slate-900
                prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
                prose-code:rounded-md prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5
                prose-code:text-brand-800 prose-code:before:content-none prose-code:after:content-none
                prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-slate-50
                dark:prose-invert dark:text-slate-200 dark:prose-headings:text-white
                dark:prose-code:bg-dark-900 dark:prose-code:text-brand-200
                dark:prose-pre:border-white/10 dark:prose-pre:bg-dark-900/80 sm:text-[0.9375rem]"
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div
          className={`mt-1.5 flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{time}</span>
          {!isUser && (
            <button
              type="button"
              onClick={() => onSpeak(message.content)}
              className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg
                text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600
                dark:hover:bg-white/10 dark:hover:text-brand-300"
              title="Read aloud"
              aria-label="Read aloud"
            >
              <Volume2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
