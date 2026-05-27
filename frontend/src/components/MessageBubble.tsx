import { Bot, User, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  onSpeak: (text: string) => void;
}

export default function MessageBubble({ message, onSpeak }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`message-fade-in flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`
        shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser
          ? 'bg-gradient-to-br from-blue-500 to-purple-600'
          : 'bg-dark-700 border border-dark-600'}
      `}>
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-dark-200" />}
      </div>

      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          rounded-2xl px-4 py-2.5 
          ${isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
            : 'bg-dark-700 border border-dark-600 text-dark-100'}
        `}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none
              prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
              prose-code:bg-dark-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-dark-800 prose-pre:border prose-pre:border-dark-600">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-dark-400">{time}</span>
          {!isUser && (
            <button
              onClick={() => onSpeak(message.content)}
              className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-200 transition-colors"
              title="Read aloud"
            >
              <Volume2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
