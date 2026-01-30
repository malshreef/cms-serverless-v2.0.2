/**
 * Lambda Function: Handle Push Notification Unsubscription
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { subscription } = body;

    const userId = event.requestContext.authorizer.claims.sub;

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

    const subscriptionId = generateSubscriptionId(subscription);

    // Get existing subscription to check SNS subscription
    const existingItem = await dynamodb.get({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: { subscriptionId }
    }).promise();

    // Unsubscribe from SNS if exists
    if (existingItem.Item && existingItem.Item.snsSubscriptionArn) {
      try {
        await sns.unsubscribe({
          SubscriptionArn: existingItem.Item.snsSubscriptionArn
        }).promise();
      } catch (snsError) {
        console.error('SNS unsubscribe error:', snsError);
      }
    }

    // Mark subscription as inactive
    await dynamodb.update({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: { subscriptionId },
      UpdateExpression: 'SET active = :false, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':false': false,
        ':timestamp': new Date().toISOString()
      }
    }).promise();

    console.log('Unsubscribed:', subscriptionId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Successfully unsubscribed from notifications'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to unsubscribe',
        message: error.message
      })
    };
  }
};

function generateSubscriptionId(subscription) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(subscription.endpoint);
  return hash.digest('hex');
}
