import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Message } from '../types';
import { sendMessage as apiSendMessage, getToken } from '../services/api';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId);

  useEffect(() => {
    setActiveConversationId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    connectSocket(token);
    const socket = getSocket();
    if (!socket) return;

    socket.on('newMessage', (data: {
      conversationId: string;
      message: { role: string; content: string };
    }) => {
      if (data.conversationId === activeConversationId) {
        const msg: Message = {
          id: Date.now().toString(),
          role: data.message.role as 'user' | 'assistant',
          content: data.message.content,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, msg]);
        setLoading(false);
      }
    });

    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setLoading(false);
    });

    return () => {
      socket.off('newMessage');
      socket.off('error');
      disconnectSocket();
    };
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

    try {
      const response = await apiSendMessage(content, activeConversationId || undefined);
      if (response.success) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
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
      if (axios.isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConversationId]);

  return { messages, loading, error, sendMessage, setMessages, activeConversationId };
}
