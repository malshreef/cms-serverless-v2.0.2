/**
 * Lambda Function: Update Notification Preferences
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE;
const USER_PREFERENCES_TABLE = process.env.USER_PREFERENCES_TABLE;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const userId = event.requestContext.authorizer.claims.sub;

    // Handle GET request - retrieve preferences
    if (event.httpMethod === 'GET') {
      const result = await dynamodb.get({
        TableName: USER_PREFERENCES_TABLE,
        Key: { userId }
      }).promise();

      const preferences = result.Item?.preferences || {
        articles: true,
        news: true,
        tags: true,
        sections: true
      };

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      };
    }

    // Handle PUT request - update preferences
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const preferences = body;

      // Validate preferences
      const validKeys = ['articles', 'news', 'tags', 'sections'];
      for (const key of Object.keys(preferences)) {
        if (!validKeys.includes(key)) {
          return {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              error: `Invalid preference key: ${key}`
            })
          };
        }
      }

      // Store preferences
      await dynamodb.put({
        TableName: USER_PREFERENCES_TABLE,
        Item: {
          userId,
          preferences,
          updatedAt: new Date().toISOString()
        }
      }).promise();

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          preferences,
          message: 'Preferences updated successfully'
        })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Method not allowed'
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
        error: 'Failed to process preferences',
        message: error.message
      })
    };
  }
};
