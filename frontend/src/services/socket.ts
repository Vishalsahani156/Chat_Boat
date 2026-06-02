import { io, Socket } from 'socket.io-client';

const URL = window.location.origin;

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): void {
  disconnectSocket();
  socket = io(URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
