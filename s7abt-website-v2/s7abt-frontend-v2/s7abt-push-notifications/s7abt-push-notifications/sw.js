/**
 * Service Worker for Push Notifications
 * Handles push events and notification clicks
 */

// Service Worker version - increment this to force update
const SW_VERSION = '1.0.0';
const CACHE_NAME = `s7abt-notifications-${SW_VERSION}`;

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing version:', SW_VERSION);
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating version:', SW_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Push event - triggered when notification is received
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let notificationData = {
    title: 'S7abt Notification',
    body: 'You have a new notification',
    icon: '/cloud-icon.png',
    badge: '/cloud-icon.png',
    data: {}
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[Service Worker] Push data:', data);
      
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        image: data.image,
        tag: data.tag || 's7abt-notification',
        requireInteraction: data.requireInteraction || false,
        data: {
          url: data.url || '/',
          type: data.type || 'general',
          id: data.id,
          ...data.data
        }
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: getNotificationActions(notificationData.data.type)
    })
  );
});

// Get notification actions based on type
function getNotificationActions(type) {
  const actions = {
    article: [
      { action: 'view', title: 'View Article', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ],
    news: [
      { action: 'view', title: 'Read News', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ],
    tag: [
      { action: 'view', title: 'View Tag', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ],
    section: [
      { action: 'view', title: 'View Section', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ],
    general: [
      { action: 'view', title: 'View', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]
  };

  return actions[type] || actions.general;
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
  
  // Track notification dismissal if needed
  const data = event.notification.data;
  
  if (data.id) {
    // You can send analytics or tracking data here
    trackNotificationDismissal(data);
  }
});

// Track notification dismissal
async function trackNotificationDismissal(data) {
  try {
    // Send dismissal tracking to backend
    await fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'notification_dismissed',
        notificationId: data.id,
        type: data.type,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('[Service Worker] Error tracking dismissal:', error);
  }
}

// Background sync event (optional - for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications when back online
async function syncNotifications() {
  try {
    // Fetch any missed notifications
    const response = await fetch('/api/notifications/missed');
    const notifications = await response.json();
    
    // Show missed notifications
    for (const notification of notifications) {
      await self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        data: notification.data
      });
    }
  } catch (error) {
    console.error('[Service Worker] Error syncing notifications:', error);
  }
}

// Message event - for communication with the main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});
