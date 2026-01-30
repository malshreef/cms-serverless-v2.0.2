/**
 * Service Worker for Push Notifications - LOCAL DEVELOPMENT VERSION
 * Works with http://localhost:5173
 */

// Service Worker version - increment this to force update
const SW_VERSION = '1.0.0-dev';
const CACHE_NAME = `s7abt-notifications-dev-${SW_VERSION}`;

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
    data: {
      url: '/dashboard'
    }
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
          url: data.url || '/dashboard',
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
      { action: 'view', title: 'View Article' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    news: [
      { action: 'view', title: 'Read News' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: [
      { action: 'view', title: 'View Tag' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    section: [
      { action: 'view', title: 'View Section' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    test: [
      { action: 'view', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    general: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
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
  // For localhost development
  const baseUrl = 'http://localhost:5173';
  const urlToOpen = data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open to localhost
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('localhost:5173') && 'focus' in client) {
            // Navigate to the URL
            client.navigate(urlToOpen);
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
  
  const data = event.notification.data;
  
  if (data.id) {
    // Track notification dismissal
    console.log('[Service Worker] Notification dismissed:', data);
  }
});

// Message event - for communication with the main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }

  // Handle test notification from the app
  if (event.data.type === 'SEND_TEST_NOTIFICATION') {
    self.registration.showNotification('Test Notification', {
      body: 'This is a test notification from S7abt! 🎉',
      icon: '/cloud-icon.png',
      badge: '/cloud-icon.png',
      tag: 's7abt-test',
      data: {
        url: '/dashboard',
        type: 'test'
      }
    });
  }
});

// Fetch event - don't cache anything in development
self.addEventListener('fetch', (event) => {
  // Let all requests pass through without caching in development
  event.respondWith(fetch(event.request));
});
