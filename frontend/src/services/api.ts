import axios from 'axios';
import { ApiResponse, Conversation, Message } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function sendMessage(message: string, conversationId?: string) {
  const response = await api.post<ApiResponse<{ reply: string; conversationId: string }>>('/chat', {
    message,
    conversationId
  });
  return response.data;
}

export async function getHistory() {
  const response = await api.get<ApiResponse<Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    _count: { messages: number };
  }>>>('/chat/history');
  return response.data;
}

export async function getConversation(id: string) {
  const response = await api.get<ApiResponse<{
    id: string;
    title: string;
    messages: Message[];
  }>>(`/chat/history/${id}`);
  return response.data;
}

export async function sendVoiceChat(audioText: string, conversationId?: string) {
  const response = await api.post<ApiResponse<{ reply: string; conversationId: string }>>('/voice-chat', {
    audioText,
    conversationId
  });
  return response.data;
}

export async function deleteConversation(id: string) {
  const response = await api.delete(`/chat/history/${id}`);
  return response.data;
}
