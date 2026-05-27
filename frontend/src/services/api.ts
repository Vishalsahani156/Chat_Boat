import axios from 'axios';
import { ApiResponse, AuthResponse, AuthUser, Message } from '../types';

const TOKEN_KEY = 'auth_token';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        clearToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function register(name: string, email: string, password: string) {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
    name,
    email,
    password
  });
  return response.data;
}

export async function login(email: string, password: string) {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
    email,
    password
  });
  return response.data;
}

export async function getMe() {
  const response = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
  return response.data;
}

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
    messageCount: number;
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

export async function deleteAllConversations() {
  const response = await api.delete<ApiResponse<{ message: string; deletedCount: number }>>('/chat/history');
  return response.data;
}
