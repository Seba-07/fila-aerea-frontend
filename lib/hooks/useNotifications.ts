import { useEffect } from 'react';

export const useNotifications = (userId?: string) => {
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    // Solicitar permiso para notificaciones
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };

    requestNotificationPermission();
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
