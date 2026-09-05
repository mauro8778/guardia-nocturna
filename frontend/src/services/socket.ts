import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.hostname;
    // En producción (Render / Vercel), la URL de la API se configura o usa el mismo host en puerto 3000/10000
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return `${protocol}//${window.location.host}`;
  }
  return 'http://localhost:3000';
};

export const socket: Socket = io(getSocketUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
