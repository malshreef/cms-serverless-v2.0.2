import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getSubscription,
  updateNotificationPreferences,
  getNotificationPreferences,
  sendTestNotification
} from '../lib/pushNotifications';

const NotificationSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preferences, setPreferences] = useState({
    articles: true,
    news: true,
    tags: true,
    sections: true
  });

  useEffect(() => {
    checkNotificationStatus();
    loadPreferences();
  }, []);

  const checkNotificationStatus = async () => {
    const supported = isPushSupported();
    setIsSupported(supported);

    if (supported) {
      const perm = getNotificationPermission();
      setPermission(perm);

      const subscription = await getSubscription();
      setIsSubscribed(!!subscription);
    }
  };

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await subscribeToPush();
      setIsSubscribed(true);
      setPermission('granted');
      setMessage({
        type: 'success',
        text: 'Successfully subscribed to notifications!'
      });
    } catch (error) {
      console.error('Subscribe error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to subscribe to notifications'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await unsubscribeFromPush();
      setIsSubscribed(false);
      setMessage({
        type: 'success',
        text: 'Successfully unsubscribed from notifications'
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to unsubscribe from notifications'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await updateNotificationPreferences(newPreferences);
      setMessage({
        type: 'success',
        text: 'Preferences updated successfully'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update preferences'
      });
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      await sendTestNotification();
      setMessage({
        type: 'success',
        text: 'Test notification sent!'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error sending test:', error);
      setMessage({
        type: 'error',
        text: 'Failed to send test notification'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <BellOff className="w-6 h-6 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
      </div>

      {/* Status Message */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Subscription Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Permission:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            permission === 'granted' 
              ? 'bg-green-100 text-green-800' 
              : permission === 'denied'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {permission}
          </span>
        </div>
      </div>

      {/* Subscribe/Unsubscribe Button */}
      <div className="mb-6">
        {!isSubscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading || permission === 'denied'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Subscribing...</span>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Unsubscribing...</span>
              </>
            ) : (
              <>
                <BellOff className="w-5 h-5" />
                <span>Disable Notifications</span>
              </>
            )}
          </button>
        )}
        
        {permission === 'denied' && (
          <p className="mt-2 text-sm text-red-600">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </div>

      {/* Notification Preferences */}
      {isSubscribed && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notification Preferences
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose what types of notifications you want to receive:
          </p>

          <div className="space-y-3">
            {Object.entries({
              articles: 'New Articles',
              news: 'News Updates',
              tags: 'New Tags',
              sections: 'New Sections'
            }).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>

          {/* Test Notification Button */}
          <button
            onClick={handleTestNotification}
            disabled={loading}
            className="mt-6 w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Send Test Notification
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> You'll receive notifications when new content is published based on your preferences above. 
          Make sure your browser allows notifications from this site.
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;
