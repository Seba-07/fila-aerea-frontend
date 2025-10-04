import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      setConnected(false);
      return;
    }

    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: { token },
        autoConnect: true,
      });

      socket.on('connect', () => {
        console.log('✅ Socket conectado');
        setConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket desconectado');
        setConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Error de conexión Socket:', error);
        setConnected(false);
      });
    }

    return () => {
      // No desconectar aquí para mantener conexión persistente
    };
  }, [token]);

  return { socket, connected };
};

export const useFlightRealtime = (flightId: string | null, onUpdate: (data: any) => void) => {
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected || !flightId) return;

    socket.emit('subscribeFlight', flightId);

    socket.on('flightUpdated', onUpdate);
    socket.on('seatUpdated', onUpdate);

    return () => {
      socket.off('flightUpdated', onUpdate);
      socket.off('seatUpdated', onUpdate);
      socket.emit('unsubscribeFlight', flightId);
    };
  }, [socket, connected, flightId, onUpdate]);

  return { connected };
};
