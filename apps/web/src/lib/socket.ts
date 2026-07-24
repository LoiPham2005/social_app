import { io, type Socket } from 'socket.io-client';
import { tokenStorage } from './token-storage';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
// Socket.IO chạy ở gốc server, không phải dưới /api/v1
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

/** Trả về socket singleton, tự gắn access token hiện tại. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket'],
      auth: { token: tokenStorage.access },
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
