/**
 * Push Notifications Service - LOCAL DEVELOPMENT VERSION
 * Handles browser push notification subscription and management
 * Works with http://localhost:5173 for development
 */

import { fetchAuthSession } from 'aws-amplify/auth';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    console.error('VAPID_PUBLIC_KEY is not set in environment variables');
    return null;
  }
  
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
}

/**
 * Get authentication token
 */
async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

/**
 * Check if browser supports push notifications
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current push notification permission status
 */
export function getNotificationPermission() {
  if (!isPushSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register service worker
 * Works on localhost for development
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  try {
    // Unregister any existing service workers first
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Don't cache in development
    });
    
    console.log('Service Worker registered:', registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush() {
  try {
    // Check browser support
    if (!isPushSupported()) {
      throw new Error('Push notifications are not supported');
    }

    // Check if VAPID key is set
    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID_PUBLIC_KEY is not configured. Please add it to your .env file.');
    }

    // Request permission if not granted
    if (Notification.permission !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    // Register service worker
    const registration = await registerServiceWorker();

    // Convert VAPID key
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    if (!applicationServerKey) {
      throw new Error('Invalid VAPID_PUBLIC_KEY');
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log('Push subscription:', subscription);

    // Send subscription to backend
    await saveSubscriptionToBackend(subscription);

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from browser
      await subscription.unsubscribe();
      
      // Remove subscription from backend
      await removeSubscriptionFromBackend(subscription);
      
      console.log('Unsubscribed from push notifications');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    throw error;
  }
}

/**
 * Get current subscription status
 */
export async function getSubscription() {
  try {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Save subscription to backend (AWS SNS via API Gateway)
 */
async function saveSubscriptionToBackend(subscription) {
  try {
    if (!API_ENDPOINT) {
      console.warn('API_ENDPOINT not configured, subscription saved locally only');
      // Store in localStorage for development
      localStorage.setItem('pushSubscription', JSON.stringify(subscription.toJSON()));
      return { success: true, message: 'Saved locally (dev mode)' };
    }

    const token = await getAuthToken();
    
    const response = await fetch(`${API_ENDPOINT}/admin/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to save subscription: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Subscription saved to backend:', data);
    
    return data;
  } catch (error) {
    console.error('Error saving subscription to backend:', error);
    // Don't throw - allow local development to continue
    console.warn('Subscription saved locally only');
    localStorage.setItem('pushSubscription', JSON.stringify(subscription.toJSON()));
    return { success: true, message: 'Saved locally (backend unavailable)' };
  }
}

/**
 * Remove subscription from backend
 */
async function removeSubscriptionFromBackend(subscription) {
  try {
    if (!API_ENDPOINT) {
      localStorage.removeItem('pushSubscription');
      return { success: true };
    }

    const token = await getAuthToken();
    
    const response = await fetch(`${API_ENDPOINT}/admin/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to remove subscription: ${response.statusText}`);
    }

    localStorage.removeItem('pushSubscription');
    return await response.json();
  } catch (error) {
    console.error('Error removing subscription from backend:', error);
    localStorage.removeItem('pushSubscription');
    return { success: true };
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences) {
  try {
    if (!API_ENDPOINT) {
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      return { success: true, preferences };
    }

    const token = await getAuthToken();
    
    const response = await fetch(`${API_ENDPOINT}/admin/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(preferences)
    });

    if (!response.ok) {
      throw new Error(`Failed to update preferences: ${response.statusText}`);
    }

    const data = await response.json();
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    return data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    return { success: true, preferences };
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences() {
  try {
    if (!API_ENDPOINT) {
      const stored = localStorage.getItem('notificationPreferences');
      return stored ? JSON.parse(stored) : {
        articles: true,
        news: true,
        tags: true,
        sections: true
      };
    }

    const token = await getAuthToken();
    
    const response = await fetch(`${API_ENDPOINT}/admin/notifications/preferences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get preferences: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    const stored = localStorage.getItem('notificationPreferences');
    return stored ? JSON.parse(stored) : {
      articles: true,
      news: true,
      tags: true,
      sections: true
    };
  }
}

/**
 * Send test notification (for development)
 */
export async function sendTestNotification() {
  try {
    // For local development, show a browser notification directly
    if (!API_ENDPOINT || window.location.hostname === 'localhost') {
      if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification('Test Notification', {
          body: 'This is a test notification from S7abt! 🎉',
          icon: '/cloud-icon.png',
          badge: '/cloud-icon.png',
          tag: 's7abt-test',
          data: {
            url: '/dashboard',
            type: 'test'
          }
        });
        
        return { success: true, message: 'Test notification sent!' };
      } else {
        throw new Error('Notification permission not granted');
      }
    }

    // Production: use backend
    const token = await getAuthToken();
    
    const response = await fetch(`${API_ENDPOINT}/admin/notifications/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to send test notification: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}
