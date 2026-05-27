import axios from 'axios';
import { ApiResponse, AuthResponse, AuthUser, Message, VoiceAudioResult } from '../types';

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
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/me');
      if (!isAuthEndpoint) {
        clearToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
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

export async function streamMessage(
  message: string,
  conversationId: string | undefined,
  onChunk: (text: string) => void
): Promise<{ reply: string; conversationId: string } | null> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, conversationId })
    });
  } catch {
    throw new Error(
      'Cannot reach the server. Start the backend with npm run dev in the backend folder.'
    );
  }

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || 'Stream request failed');
  }

  const reader = response.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffer = '';
  let result: { reply: string; conversationId: string } | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6)) as {
          type: string;
          text?: string;
          reply?: string;
          conversationId?: string;
          message?: string;
        };
        if (data.type === 'chunk' && data.text) {
          onChunk(data.text);
        } else if (data.type === 'done' && data.reply && data.conversationId) {
          result = { reply: data.reply, conversationId: data.conversationId };
        } else if (data.type === 'error') {
          throw new Error(data.message || 'Stream failed');
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  return result;
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

export async function sendVoiceAudio(blob: Blob, conversationId?: string) {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  if (conversationId) {
    formData.append('conversationId', conversationId);
  }

  const response = await api.post<ApiResponse<VoiceAudioResult>>('/voice/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
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
