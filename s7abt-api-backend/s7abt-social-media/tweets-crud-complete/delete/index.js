/**
 * Delete Tweet Lambda Function
 * DELETE /admin/tweets/{id}
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'me-central-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TWEET_QUEUE_TABLE || 's7abt-tweet-queue-dev';

exports.handler = async (event) => {
  console.log('Delete tweet request:', JSON.stringify(event, null, 2));

  try {
    const tweetId = event.pathParameters?.id;

    if (!tweetId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Tweet ID is required'
        })
      };
    }

    // Check if tweet exists
    const getResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { tweet_id: tweetId }
    }));

    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Tweet not found'
        })
      };
    }

    // Delete the tweet
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { tweet_id: tweetId }
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Tweet deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error deleting tweet:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};

