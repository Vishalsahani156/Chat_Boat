import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Message } from '../types';
import { sendMessage as apiSendMessage, streamMessage as apiStreamMessage } from '../services/api';

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId);
  const activeConversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    setActiveConversationId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const sendMessage = useCallback(async (content: string): Promise<string | null> => {
    setError(null);
    setLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    const assistantId = `ai-${Date.now()}`;
    const useStream = import.meta.env.VITE_CHAT_STREAM !== 'false';

    try {
      if (useStream) {
        setMessages(prev => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString()
          }
        ]);

        const result = await apiStreamMessage(
          content,
          activeConversationIdRef.current || undefined,
          (chunk) => {
            setMessages(prev =>
              prev.map(m => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
            );
          }
        );

        if (result) {
          setActiveConversationId(result.conversationId);
          return result.conversationId;
        }
        setMessages(prev => prev.filter(m => m.id !== assistantId));
        setError('No response received. Please try again.');
        return null;
      }

      const response = await apiSendMessage(content, activeConversationIdRef.current || undefined);
      if (response.success) {
        const aiMessage: Message = {
          id: assistantId,
          role: 'assistant',
          content: response.data.reply,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setActiveConversationId(response.data.conversationId);
        return response.data.conversationId;
      }
      return null;
    } catch (err: unknown) {
      let message = 'Failed to send message';
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          message = 'Cannot reach the server. Start the backend with npm run dev in the backend folder.';
        } else if (typeof err.response.data?.message === 'string') {
          message = err.response.data.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConversationId]);

  const appendVoiceMessages = useCallback(
    (userMsg: Message, assistantMsg: Message, conversationId: string) => {
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setActiveConversationId(conversationId);
    },
    []
  );

  const setConversationId = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    appendVoiceMessages,
    setConversationId,
    setMessages,
    setError,
    activeConversationId
  };
}
