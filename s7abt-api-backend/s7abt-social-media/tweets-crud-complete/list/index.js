/**
 * List Tweets Lambda Function
 * GET /admin/tweets
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'me-central-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TWEET_QUEUE_TABLE || 's7abt-tweet-queue-dev';

exports.handler = async (event) => {
  console.log('List tweets request:', JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};
    const status = queryParams.status;
    const search = queryParams.search;
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;

    let result;

    // If filtering by status, use GSI
    if (status && status !== 'all') {
      result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'status-scheduled_time-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status
        },
        ScanIndexForward: false // Most recent first
      }));
    } else {
      // Scan all tweets
      result = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME
      }));
    }

    let tweets = result.Items || [];

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      tweets = tweets.filter(tweet => 
        (tweet.tweet_text && tweet.tweet_text.toLowerCase().includes(searchLower)) ||
        (tweet.article_title && tweet.article_title.toLowerCase().includes(searchLower))
      );
    }

    // Sort by scheduled_time descending
    tweets.sort((a, b) => (b.scheduled_time || 0) - (a.scheduled_time || 0));

    // Calculate pagination
    const total = tweets.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTweets = tweets.slice(startIndex, endIndex);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: {
          tweets: paginatedTweets,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    };

  } catch (error) {
    console.error('Error listing tweets:', error);
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

