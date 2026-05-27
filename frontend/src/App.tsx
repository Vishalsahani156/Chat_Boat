import { useState, useEffect, useCallback } from 'react';
import { Conversation } from './types';
import { getHistory, getConversation, deleteConversation } from './services/api';
import { useChat } from './hooks/useChat';
import { useVoice } from './hooks/useVoice';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { messages, loading, sendMessage, setMessages, activeConversationId } = useChat(activeConversation);
  const { isListening, transcript, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice();

  const fetchHistory = useCallback(async () => {
    try {
      const response = await getHistory();
      if (response.success) {
        const mapped: Conversation[] = response.data.map(c => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: c._count.messages
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

  const handleSendMessage = useCallback(async (content: string) => {
    const newConvId = await sendMessage(content);
    if (newConvId) {
      fetchHistory();
    }
  }, [sendMessage, fetchHistory]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      const text = stopListening();
      if (text) {
        handleSendMessage(text);
      }
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening, handleSendMessage]);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      <Sidebar
        conversations={conversations}
        activeId={activeConversation}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        loading={loading}
        onToggleSidebar={() => setSidebarOpen(true)}
        isListening={isListening}
        transcript={transcript}
        isSpeaking={isSpeaking}
        onVoiceInput={handleVoiceInput}
        onSpeak={speak}
        onStopSpeaking={stopSpeaking}
      />
    </div>
  );
}
