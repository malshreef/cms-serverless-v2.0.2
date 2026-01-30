/**
 * Lambda Function: Send Push Notifications
 * 
 * This function sends push notifications to subscribed users
 * Triggered by SNS, EventBridge, or directly when content is created/updated
 */

const AWS = require('aws-sdk');
const https = require('https');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const webpush = require('web-push');

const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE;
const USER_PREFERENCES_TABLE = process.env.USER_PREFERENCES_TABLE;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@s7abt.com';

// Configure web-push
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    let notificationData;

    // Parse event based on source
    if (event.Records && event.Records[0].EventSource === 'aws:sns') {
      // Triggered by SNS
      const snsMessage = JSON.parse(event.Records[0].Sns.Message);
      notificationData = snsMessage;
    } else if (event.source === 'aws.events') {
      // Triggered by EventBridge
      notificationData = event.detail;
    } else {
      // Direct invocation
      notificationData = JSON.parse(event.body || '{}');
    }

    const {
      type,          // 'article', 'news', 'tag', 'section'
      title,
      body,
      url,
      id,
      imageUrl,
      targetUsers    // Optional: specific user IDs to notify
    } = notificationData;

    console.log('Notification data:', notificationData);

    // Get all active subscriptions
    let subscriptions;
    if (targetUsers && targetUsers.length > 0) {
      // Get specific users' subscriptions
      subscriptions = await getSubscriptionsForUsers(targetUsers);
    } else {
      // Get all active subscriptions
      subscriptions = await getAllActiveSubscriptions();
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Filter subscriptions based on user preferences
    const filteredSubscriptions = await filterByPreferences(subscriptions, type);
    
    console.log(`Sending to ${filteredSubscriptions.length} users after filtering`);

    // Prepare notification payload
    const notification = {
      title: title,
      body: body,
      icon: '/cloud-icon.png',
      badge: '/cloud-icon.png',
      image: imageUrl,
      tag: `s7abt-${type}-${id}`,
      requireInteraction: false,
      data: {
        url: url,
        type: type,
        id: id,
        timestamp: new Date().toISOString()
      }
    };

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      filteredSubscriptions.map(sub => sendPushNotification(sub, notification))
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

    // Clean up invalid subscriptions
    const invalidSubscriptions = results
      .filter(r => r.status === 'rejected' && r.reason.statusCode === 410)
      .map((r, i) => filteredSubscriptions[i]);

    if (invalidSubscriptions.length > 0) {
      await cleanupInvalidSubscriptions(invalidSubscriptions);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        sent: successful,
        failed: failed,
        total: filteredSubscriptions.length
      })
    };

  } catch (error) {
    console.error('Error sending notifications:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send notifications',
        message: error.message
      })
    };
  }
};

/**
 * Get all active subscriptions
 */
async function getAllActiveSubscriptions() {
  const params = {
    TableName: SUBSCRIPTIONS_TABLE,
    FilterExpression: 'active = :true',
    ExpressionAttributeValues: {
      ':true': true
    }
  };

  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
}

/**
 * Get subscriptions for specific users
 */
async function getSubscriptionsForUsers(userIds) {
  const subscriptions = [];
  
  for (const userId of userIds) {
    const params = {
      TableName: SUBSCRIPTIONS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'active = :true',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':true': true
      }
    };

    const result = await dynamodb.query(params).promise();
    subscriptions.push(...(result.Items || []));
  }

  return subscriptions;
}

/**
 * Filter subscriptions based on user preferences
 */
async function filterByPreferences(subscriptions, notificationType) {
  const filtered = [];

  for (const subscription of subscriptions) {
    try {
      // Get user preferences
      const prefsResult = await dynamodb.get({
        TableName: USER_PREFERENCES_TABLE,
        Key: { userId: subscription.userId }
      }).promise();

      const preferences = prefsResult.Item?.preferences || {
        articles: true,
        news: true,
        tags: true,
        sections: true
      };

      // Check if user wants this type of notification
      if (preferences[notificationType] !== false) {
        filtered.push(subscription);
      }
    } catch (error) {
      console.error(`Error getting preferences for user ${subscription.userId}:`, error);
      // Include by default if we can't get preferences
      filtered.push(subscription);
    }
  }

  return filtered;
}

/**
 * Send push notification to a subscription
 */
async function sendPushNotification(subscription, notification) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys
  };

  const payload = JSON.stringify(notification);

  try {
    await webpush.sendNotification(pushSubscription, payload);
    console.log(`Notification sent to user ${subscription.userId}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send to user ${subscription.userId}:`, error);
    throw error;
  }
}

/**
 * Clean up invalid/expired subscriptions
 */
async function cleanupInvalidSubscriptions(subscriptions) {
  console.log(`Cleaning up ${subscriptions.length} invalid subscriptions`);

  const deletePromises = subscriptions.map(sub =>
    dynamodb.update({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: { subscriptionId: sub.subscriptionId },
      UpdateExpression: 'SET active = :false, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':false': false,
        ':timestamp': new Date().toISOString()
      }
    }).promise()
  );

  await Promise.allSettled(deletePromises);
}
