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
        console.log('🔔 Iniciando configuración de push notifications...');

        // Solicitar permiso para notificaciones
        if ('Notification' in window) {
          console.log('📱 Permiso actual:', Notification.permission);

          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('📱 Nuevo permiso:', permission);

            if (permission !== 'granted') {
              console.log('❌ Permiso de notificaciones denegado');
              return;
            }
          } else if (Notification.permission === 'denied') {
            console.log('❌ Permiso de notificaciones bloqueado por el usuario');
            return;
          }
        } else {
          console.log('❌ Notification API no disponible');
          return;
        }

        // Verificar soporte para service worker y push
        if (!('serviceWorker' in navigator)) {
          console.log('❌ Service Worker no soportado');
          return;
        }

        if (!('PushManager' in window)) {
          console.log('❌ Push Manager no soportado');
          return;
        }

        console.log('✅ Service Worker y Push Manager disponibles');

        // Registrar service worker
        console.log('🔄 Registrando service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service worker registrado:', registration);

        await navigator.serviceWorker.ready;
        console.log('✅ Service worker listo');

        // Verificar si ya existe una suscripción
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          console.log('🔄 No hay suscripción previa, creando nueva...');

          // Obtener VAPID public key del servidor
          console.log('🔑 Obteniendo VAPID key...');
          const { data: { publicKey } } = await api.get('/push/vapid-key');
          console.log('✅ VAPID key obtenida:', publicKey.substring(0, 20) + '...');

          // Suscribirse a push notifications
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
          console.log('✅ Suscripción creada:', subscription.endpoint.substring(0, 50) + '...');
        } else {
          console.log('✅ Suscripción existente encontrada:', subscription.endpoint.substring(0, 50) + '...');
        }

        // Convertir keys a base64
        const p256dhKey = subscription.getKey('p256dh');
        const authKey = subscription.getKey('auth');

        const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary);
        };

        // Enviar suscripción al servidor
        console.log('🔄 Enviando suscripción al servidor...');
        await api.post('/push/subscribe', {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dhKey!),
            auth: arrayBufferToBase64(authKey!),
          },
        });

        console.log('✅ Push notification suscripción exitosa');
      } catch (error) {
        console.error('❌ Error configurando push notifications:', error);
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
