import { Plus, Trash2, X, MessageSquare, Sparkles } from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNewChat, onDelete, isOpen, onClose }: SidebarProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-72 
        bg-white border-r border-slate-200 dark:bg-dark-800 dark:border-dark-700 transition-colors duration-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full
      `}>
        <div className="p-4 border-b border-slate-200 dark:border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">AI Chatbot</h1>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-600 dark:hover:bg-dark-700 dark:text-dark-300"
            >
              <X size={20} />
            </button>
          </div>
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg
              border border-slate-300 hover:bg-slate-50 text-slate-800 transition-colors duration-200
              dark:border-dark-600 dark:hover:bg-dark-700 dark:text-dark-200"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 dark:text-dark-400">
              <MessageSquare size={24} className="mb-2" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`
                    group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                    transition-colors duration-150
                    ${activeId === conv.id
                      ? 'bg-slate-200 text-slate-900 dark:bg-dark-700 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-dark-300 dark:hover:bg-dark-700/50 dark:hover:text-dark-100'}
                  `}
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
                      {formatDate(conv.updatedAt)}
                      {conv.messageCount !== undefined && ` · ${conv.messageCount} msgs`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 
                      text-slate-500 hover:text-red-600 dark:hover:bg-dark-600 dark:text-dark-400 dark:hover:text-red-400 transition-all duration-150"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
