export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  image?: string; // data: URL, for user-attached images
}

/** Image payload sent to the API (base64, no data: prefix). */
export interface ImageInput {
  mimeType: string;
  data: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ msg: string; path?: string }>;
}

export interface VoiceAudioPayload {
  mimeType: string;
  base64: string;
}

export interface VoiceAudioResult {
  transcript: string;
  reply: string;
  conversationId: string;
  detectedLanguage: string;
  audio?: VoiceAudioPayload;
}
