import { useEffect } from 'react';
import { api } from '../api';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const useNotifications = (userId?: string) => {
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    const setupPushNotifications = async () => {
      try {
        // Solicitar permiso para notificaciones
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Permiso de notificaciones denegado');
            return;
          }
        }

        // Verificar soporte para service worker y push
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.log('Push notifications no soportadas');
          return;
        }

        // Registrar service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Obtener VAPID public key del servidor
        const { data: { publicKey } } = await api.get('/push/vapid-key');

        // Suscribirse a push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // Enviar suscripción al servidor
        await api.post('/push/subscribe', {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        });

        console.log('Push notification suscripción exitosa');
      } catch (error) {
        console.error('Error configurando push notifications:', error);
      }
    };

    setupPushNotifications();
  }, [userId]);

  const showNotification = (title: string, body: string, data?: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'flight-rescheduling',
        requireInteraction: true,
        data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (data?.url) {
          window.location.href = data.url;
        }
      };
    }
  };

  return { showNotification };
};
