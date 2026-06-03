import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../config/backendUrl';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): void {
  disconnectSocket();
  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  if (import.meta.env.DEV) {
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message);
    });
    socket.on('disconnect', (reason) => {
      console.warn('[socket] disconnect:', reason);
    });
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
