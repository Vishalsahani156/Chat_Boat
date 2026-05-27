import { io, Socket } from 'socket.io-client';

// Same origin as the SPA so dev uses Vite's `/socket.io` proxy (see vite.config.ts).
// Avoids mixed localhost vs 127.0.0.1 CORS issues when hitting the backend directly.
const URL = window.location.origin;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
