import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { ImageInput, Message } from '../types';
import { sendMessage as apiSendMessage, streamMessage as apiStreamMessage } from '../services/api';
import { getNetworkErrorMessage } from '../utils/networkErrors';

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

  const sendMessage = useCallback(async (
    content: string,
    image?: ImageInput,
    imagePreview?: string,
    isRetry = false
  ): Promise<string | null> => {
    setError(null);
    setLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      image: imagePreview
    };
    setMessages(prev => [...prev, userMessage]);

    const assistantId = `ai-${Date.now()}`;
    // Image chat uses the non-streaming endpoint (SSE path is text-only).
    const useStream = !image && import.meta.env.VITE_CHAT_STREAM !== 'false';

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

      const response = await apiSendMessage(content, activeConversationIdRef.current || undefined, image);
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
      let staleConversation = false;
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          message = getNetworkErrorMessage();
        } else if (typeof err.response.data?.message === 'string') {
          message = err.response.data.message;
          staleConversation =
            err.response.status === 404 && message === 'Conversation not found';
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      if (staleConversation && !isRetry) {
        setActiveConversationId(null);
        activeConversationIdRef.current = null;
        setError(null);
        setMessages(prev => prev.filter(m => m.id !== userMessage.id && m.id !== assistantId));
        return sendMessage(content, image, imagePreview, true);
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

  const setConversationId = useCallback((id: string | null) => {
    setActiveConversationId(id);
    activeConversationIdRef.current = id;
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
