import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;
let globalConnected = false; // Estado global de conexión

export const useSocket = () => {
  const [connected, setConnected] = useState(globalConnected);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        socket = null;
        globalConnected = false;
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
        globalConnected = true;
        setConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket desconectado');
        globalConnected = false;
        setConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Error de conexión Socket:', error);
        globalConnected = false;
        setConnected(false);
      });

      // Escuchar notificaciones de reprogramación
      socket.on('flightRescheduled', (data: any) => {
        console.log('🔔 Vuelo reprogramado:', data);

        // Mostrar notificación del navegador si tiene permisos
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('✈️ Vuelo Reprogramado', {
            body: `Tu vuelo del circuito ${data.circuito_anterior} fue reprogramado al circuito ${data.circuito_nuevo}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'flight-rescheduling',
            requireInteraction: true,
          });
        }
      });

      // Escuchar notificaciones de cambio de hora
      socket.on('timeChanged', (data: any) => {
        console.log('🔔 Hora de vuelo cambiada:', data);

        // Mostrar notificación del navegador si tiene permisos
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ Cambio de Hora de Vuelo', {
            body: `Tu vuelo del circuito ${data.numero_circuito} cambió de hora: ${data.hora_anterior} → ${data.hora_nueva}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'time-change',
            requireInteraction: true,
          });
        }

        // Recargar datos del usuario para actualizar tickets
        const { updateTickets } = useAuthStore.getState();
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/me`, {
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().token}`
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.tickets) {
              updateTickets(data.tickets);
            }
          })
          .catch(err => console.error('Error recargando tickets:', err));
      });
    } else {
      // Si el socket ya existe, usar su estado actual
      setConnected(socket.connected);
      globalConnected = socket.connected;
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
