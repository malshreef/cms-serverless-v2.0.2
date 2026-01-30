/**
 * Lambda Function: Handle Push Notification Subscription
 * 
 * This function handles subscribing users to push notifications
 * and stores subscription data in DynamoDB
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { subscription } = body;

    // Get user info from Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;
    const userEmail = event.requestContext.authorizer.claims.email;

    if (!subscription) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Subscription data is required'
        })
      };
    }

    // Generate unique subscription ID
    const subscriptionId = generateSubscriptionId(subscription);

    // Subscribe to SNS topic for email notifications (optional)
    let snsSubscriptionArn = null;
    if (userEmail && SNS_TOPIC_ARN) {
      try {
        const snsResponse = await sns.subscribe({
          Protocol: 'email',
          TopicArn: SNS_TOPIC_ARN,
          Endpoint: userEmail,
          Attributes: {
            FilterPolicy: JSON.stringify({
              userId: [userId]
            })
          }
        }).promise();
        
        snsSubscriptionArn = snsResponse.SubscriptionArn;
      } catch (snsError) {
        console.error('SNS subscription error:', snsError);
        // Continue even if SNS subscription fails
      }
    }

    // Store subscription in DynamoDB
    const timestamp = new Date().toISOString();
    const item = {
      subscriptionId,
      userId,
      userEmail,
      subscription: subscription,
      snsSubscriptionArn,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      createdAt: timestamp,
      updatedAt: timestamp,
      active: true,
      preferences: {
        articles: true,
        news: true,
        tags: true,
        sections: true
      }
    };

    await dynamodb.put({
      TableName: SUBSCRIPTIONS_TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(subscriptionId) OR active = :false',
      ExpressionAttributeValues: {
        ':false': false
      }
    }).promise();

    console.log('Subscription saved:', subscriptionId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        subscriptionId,
        message: 'Successfully subscribed to notifications'
      })
    };

  } catch (error) {
    console.error('Error:', error);

    // Handle conditional check failure (already subscribed)
    if (error.code === 'ConditionalCheckFailedException') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Already subscribed'
        })
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to subscribe to notifications',
        message: error.message
      })
    };
  }
};

/**
 * Generate a unique subscription ID from subscription object
 */
function generateSubscriptionId(subscription) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(subscription.endpoint);
  return hash.digest('hex');
}
