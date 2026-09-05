import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string') {
    return envApiUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3050';
    }
    return `${window.location.protocol}//${window.location.host}`;
  }
  return 'http://localhost:3050';
};

export const socket: Socket = io(getSocketUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
