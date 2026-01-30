/**
 * Lambda Function: Send Test Notification
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const SEND_NOTIFICATION_FUNCTION = process.env.SEND_NOTIFICATION_FUNCTION;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userEmail = event.requestContext.authorizer.claims.email;

    // Prepare test notification
    const testNotification = {
      type: 'general',
      title: 'Test Notification',
      body: 'This is a test notification from S7abt. If you can see this, push notifications are working!',
      url: '/',
      id: 'test-' + Date.now(),
      targetUsers: [userId]
    };

    // Invoke the send notification Lambda
    const invokeParams = {
      FunctionName: SEND_NOTIFICATION_FUNCTION,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify({
        body: JSON.stringify(testNotification)
      })
    };

    await lambda.invoke(invokeParams).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Test notification sent'
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
        error: 'Failed to send test notification',
        message: error.message
      })
    };
  }
};
