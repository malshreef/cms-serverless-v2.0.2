/**
 * Approve Tweet Lambda Function
 * POST /admin/tweets/{id}/approve
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'me-central-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TWEET_QUEUE_TABLE || 's7abt-tweet-queue-dev';

exports.handler = async (event) => {
  console.log('Approve tweet request:', JSON.stringify(event, null, 2));

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

    // Get the tweet
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

    // Update tweet status to pending (approved)
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tweet_id: tweetId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'pending'
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Tweet approved successfully',
        data: {
          tweet_id: tweetId,
          status: 'pending'
        }
      })
    };

  } catch (error) {
    console.error('Error approving tweet:', error);
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

