import { Sparkles, Code, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

const suggestions = [
  {
    icon: Code,
    title: 'Write Code',
    prompt: 'Help me write a Python function that sorts a list of dictionaries by a specific key'
  },
  {
    icon: BookOpen,
    title: 'Explain Concepts',
    prompt: 'Explain how async/await works in JavaScript with examples'
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm Ideas',
    prompt: 'Give me creative project ideas for a portfolio website'
  },
  {
    icon: MessageSquare,
    title: 'General Chat',
    prompt: 'What are the latest trends in web development?'
  }
];

export default function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 
          flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles size={32} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
        <p className="text-dark-400 mb-8">I'm your AI assistant. Ask me anything or choose a prompt below.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onPromptClick(item.prompt)}
              className="flex items-start gap-3 p-4 rounded-xl border border-dark-600 
                bg-dark-700/50 hover:bg-dark-700 hover:border-dark-500
                transition-all duration-200 text-left group"
            >
              <div className="shrink-0 w-8 h-8 rounded-lg bg-dark-600 group-hover:bg-dark-500 
                flex items-center justify-center transition-colors">
                <item.icon size={16} className="text-dark-200" />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-100">{item.title}</p>
                <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{item.prompt}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
