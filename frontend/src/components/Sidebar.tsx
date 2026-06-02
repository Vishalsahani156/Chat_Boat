import { Plus, Trash2, Trash, X, MessageSquare, Sparkles, LogOut } from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onDeleteAll,
  isOpen,
  onClose,
  userName,
  userEmail,
  onLogout,
}: SidebarProps) {
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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(100vw-3rem,18rem)] flex-col
          border-r border-slate-200/80 bg-white/90 backdrop-blur-xl
          transition-transform duration-300 ease-out
          dark:border-white/[0.06] dark:bg-dark-900/95
          md:relative md:w-72 md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="border-b border-slate-200/80 p-4 dark:border-white/[0.06]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-sm">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-slate-900 dark:text-white">AI Chatbot</h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Your AI assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon !min-h-[40px] !min-w-[40px] md:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <button type="button" onClick={onNewChat} className="btn-primary w-full">
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-dark-800">
                <MessageSquare size={22} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No chats yet</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Start a conversation to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`chat-item group ${
                    activeId === conv.id ? 'chat-item-active' : 'chat-item-inactive'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(conv.id);
                    }
                  }}
                >
                  <MessageSquare
                    size={16}
                    className={`shrink-0 ${activeId === conv.id ? 'text-brand-600 dark:text-brand-400' : ''}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{conv.title}</p>
                    <p className="mt-0.5 truncate text-[11px] opacity-70">
                      {formatDate(conv.updatedAt)}
                      {conv.messageCount !== undefined && ` · ${conv.messageCount} msgs`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg
                      opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100
                      text-slate-400 hover:bg-red-50 hover:text-red-600
                      dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {conversations.length > 0 && (
          <div className="border-t border-slate-200/80 p-3 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onDeleteAll}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2
                text-sm font-medium text-red-600 transition-colors hover:bg-red-50
                dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash size={16} />
              Clear all chats
            </button>
          </div>
        )}

        <div className="border-t border-slate-200/80 p-3 dark:border-white/[0.06]">
          {userName && (
            <div className="mb-3 rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-dark-800/60">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{userName}</p>
              {userEmail && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
              )}
            </div>
          )}
          <button type="button" onClick={onLogout} className="btn-secondary w-full">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
