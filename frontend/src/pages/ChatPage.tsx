import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation } from '../types';
import { getHistory, getConversation, deleteConversation, deleteAllConversations } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { messages, loading, error, sendMessage, setMessages, activeConversationId } = useChat(activeConversation);
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice();

  const fetchHistory = useCallback(async () => {
    try {
      const response = await getHistory();
      if (response.success) {
        const mapped: Conversation[] = response.data.map(c => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: c.messageCount
        }));
        setConversations(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (activeConversationId && activeConversationId !== activeConversation) {
      setActiveConversation(activeConversationId);
      fetchHistory();
    }
  }, [activeConversationId, activeConversation, fetchHistory]);

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversation(id);
    setSidebarOpen(false);
    try {
      const response = await getConversation(id);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }, [setMessages]);

  const handleNewChat = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setSidebarOpen(false);
  }, [setMessages]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [activeConversation, setMessages]);

  const handleDeleteAllConversations = useCallback(async () => {
    if (conversations.length === 0) return;

    const confirmed = window.confirm(
      `Delete all ${conversations.length} conversation${conversations.length === 1 ? '' : 's'}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteAllConversations();
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to delete all conversations:', err);
    }
  }, [conversations.length, setMessages]);

  const handleSendMessage = useCallback(async (content: string) => {
    const newConvId = await sendMessage(content);
    if (newConvId) {
      fetchHistory();
    }
  }, [sendMessage, fetchHistory]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-dark-900 transition-colors duration-200">
      <Sidebar
        conversations={conversations}
        activeId={activeConversation}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        onDeleteAll={handleDeleteAllConversations}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={user?.name}
        userEmail={user?.email}
        onLogout={handleLogout}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        loading={loading}
        error={error}
        onToggleSidebar={() => setSidebarOpen(true)}
        isListening={isListening}
        isSpeaking={isSpeaking}
        onVoiceInput={handleVoiceInput}
        onSpeak={speak}
        onStopSpeaking={stopSpeaking}
      />
    </div>
  );
}
