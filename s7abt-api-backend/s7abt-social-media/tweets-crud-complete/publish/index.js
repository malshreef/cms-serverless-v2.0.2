/**
 * Publish Tweet Lambda Function
 * POST /admin/tweets/{id}/publish
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'me-central-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TWEET_QUEUE_TABLE || 's7abt-tweet-queue-dev';

exports.handler = async (event) => {
  console.log('Publish tweet request:', JSON.stringify(event, null, 2));

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

    const tweet = getResult.Item;

    // Check if already published
    if (tweet.status === 'posted') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Tweet has already been published'
        })
      };
    }

    // Update tweet status to posted
    // Note: Actual Twitter posting should be done by the tweet-publisher Lambda
    // This just marks it as ready to post immediately
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tweet_id: tweetId },
      UpdateExpression: 'SET #status = :status, scheduled_time = :now',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'pending',
        ':now': Date.now()
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
        message: 'Tweet scheduled for immediate publishing',
        data: {
          tweet_id: tweetId,
          status: 'pending',
          scheduled_time: Date.now()
        }
      })
    };

  } catch (error) {
    console.error('Error publishing tweet:', error);
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

