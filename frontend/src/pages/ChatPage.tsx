import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation, ImageInput } from '../types';
import {
  getHistory,
  getConversation,
  deleteConversation,
  deleteAllConversations,
} from '../services/api';
import { getAuthErrorMessage } from '../utils/authErrors';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useLiveVoice } from '../hooks/useLiveVoice';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    messages,
    loading,
    error,
    sendMessage,
    appendVoiceMessages,
    setConversationId,
    setMessages,
    setError,
    activeConversationId,
  } = useChat(activeConversation);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await getHistory();
      if (response.success) {
        const mapped: Conversation[] = response.data.map((c) => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: c.messageCount,
        }));
        setConversations(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError(getAuthErrorMessage(err) || 'Could not load chat history.');
    }
  }, [setError]);

  const { speak, stopSpeaking, isSpeaking } = useVoice();

  const voiceChat = useVoiceChat({
    conversationId: activeConversationId,
    onMessages: appendVoiceMessages,
    onConversationId: (id) => {
      setConversationId(id);
      setActiveConversation(id);
      void fetchHistory();
    },
    onError: setError
  });

  const liveVoice = useLiveVoice({
    conversationId: activeConversationId,
    onTranscript: (text, _language) => {
      const now = new Date().toISOString();
      setMessages(prev => [
        ...prev,
        {
          id: `user-live-${Date.now()}`,
          role: 'user',
          content: text,
          createdAt: now
        }
      ]);
    },
    onAssistantChunk: (chunk, done) => {
      if (done && !chunk) return;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id.startsWith('ai-live-')) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: m.content + chunk } : m
          );
        }
        return [
          ...prev,
          {
            id: `ai-live-${Date.now()}`,
            role: 'assistant' as const,
            content: chunk,
            createdAt: new Date().toISOString()
          }
        ];
      });
    },
    onAssistantDone: (reply, convId) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id.startsWith('ai-live-')) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: reply } : m
          );
        }
        return [
          ...prev,
          {
            id: `ai-live-${Date.now()}`,
            role: 'assistant' as const,
            content: reply,
            createdAt: new Date().toISOString()
          }
        ];
      });
      setConversationId(convId);
      setActiveConversation(convId);
      void fetchHistory();
    },
    onError: setError
  });

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (activeConversationId && activeConversationId !== activeConversation) {
      setActiveConversation(activeConversationId);
      void fetchHistory();
    }
  }, [activeConversationId, activeConversation, fetchHistory]);

  const handleSelectConversation = useCallback(async (id: string) => {
    if (liveVoice.isActive) {
      await liveVoice.stopLiveMode();
    }
    setActiveConversation(id);
    setConversationId(id);
    setError(null);
    setSidebarOpen(false);
    try {
      const response = await getConversation(id);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('This chat was deleted or is no longer available.');
      setActiveConversation(null);
      setConversationId(null);
      setMessages([]);
      setConversations(prev => prev.filter(c => c.id !== id));
    }
  }, [setMessages, setConversationId, setError, liveVoice]);

  const handleNewChat = useCallback(async () => {
    if (liveVoice.isActive) {
      await liveVoice.stopLiveMode();
    }
    setConversationId(null);
    setActiveConversation(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  }, [setMessages, setConversationId, setError, liveVoice]);

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
      setError(getAuthErrorMessage(err) || 'Could not delete this chat.');
    }
  }, [activeConversation, setMessages, setError]);

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
      setError(getAuthErrorMessage(err) || 'Could not delete chats.');
    }
  }, [conversations.length, setMessages, setError]);

  const handleSendMessage = useCallback(async (content: string, image?: ImageInput, imagePreview?: string) => {
    const newConvId = await sendMessage(content, image, imagePreview);
    if (newConvId) {
      void fetchHistory();
    }
  }, [sendMessage, fetchHistory]);

  const handleVoiceInput = useCallback(() => {
    if (liveVoice.isActive) return;
    void voiceChat.toggleRecording();
  }, [voiceChat, liveVoice.isActive]);

  const handleLogout = useCallback(() => {
    void liveVoice.stopLiveMode();
    logout();
    navigate('/login');
  }, [logout, navigate, liveVoice]);

  const voiceBusy =
    voiceChat.isRecording ||
    voiceChat.isProcessing ||
    voiceChat.isSpeaking ||
    liveVoice.isActive;

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden">
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
        isListening={voiceChat.isRecording}
        isProcessing={voiceChat.isProcessing}
        isSpeaking={isSpeaking || voiceChat.isSpeaking}
        voiceDisabled={liveVoice.isActive}
        liveVoiceDisabled={
          voiceChat.isRecording || voiceChat.isProcessing || voiceChat.isSpeaking
        }
        onVoiceInput={handleVoiceInput}
        onSpeak={speak}
        onStopSpeaking={() => {
          stopSpeaking();
          voiceChat.stopSpeaking();
        }}
        liveVoiceStatus={liveVoice.status}
        onLiveVoiceStart={() => {
          if (voiceChat.isRecording || voiceChat.isProcessing || voiceChat.isSpeaking) {
            return;
          }
          void liveVoice.startLiveMode();
        }}
        onLiveVoiceStop={() => void liveVoice.stopLiveMode()}
        onLiveVoiceEndTurn={() => void liveVoice.endLiveMode()}
        onLiveVoiceInterrupt={() => void liveVoice.interrupt()}
        isLiveProcessing={liveVoice.status === 'processing'}
        inputDisabled={voiceBusy}
      />
    </div>
  );
}
