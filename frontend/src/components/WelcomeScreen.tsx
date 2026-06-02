import { Sparkles, Code, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestionClick?: (prompt: string) => void;
}

const suggestions = [
  {
    icon: Code,
    title: 'Write Code',
    prompt: 'Help me write a Python function that sorts a list of dictionaries by a specific key',
    accent: 'from-violet-500/20 to-indigo-500/20 text-violet-600 dark:text-violet-300',
  },
  {
    icon: BookOpen,
    title: 'Explain Concepts',
    prompt: 'Explain how async/await works in JavaScript with examples',
    accent: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-300',
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm Ideas',
    prompt: 'Give me creative project ideas for a portfolio website',
    accent: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300',
  },
  {
    icon: MessageSquare,
    title: 'General Chat',
    prompt: 'What are the latest trends in web development?',
    accent: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-300',
  },
];

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-2xl animate-fade-in-up text-center">
        <div
          className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl
            bg-gradient-brand shadow-glow sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-3xl"
        >
          <Sparkles size={32} className="text-white" />
          <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-brand opacity-20 blur-xl" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          How can I help you today?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
          Type a message, tap the mic for voice, or pick a starter below.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSuggestionClick?.(item.prompt)}
              className="suggestion-card group"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} transition-transform group-hover:scale-105`}
              >
                <item.icon size={18} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {item.prompt}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
