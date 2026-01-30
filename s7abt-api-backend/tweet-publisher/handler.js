/**
 * S7abt Tweet Publisher Lambda Function
 * Posts pending tweets to Twitter at scheduled time (3 PM Riyadh time daily)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { TwitterApi } = require('twitter-api-v2');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.TWEET_QUEUE_TABLE;
const TWITTER_SECRET_NAME = process.env.TWITTER_SECRET_NAME || 's7abt/twitter/credentials';

// Cache for Twitter client
let twitterClient = null;

/**
 * Get Twitter credentials from Secrets Manager
 */
async function getTwitterCredentials() {
  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: TWITTER_SECRET_NAME })
    );
    
    const credentials = JSON.parse(response.SecretString);
    return {
      appKey: credentials.api_key,
      appSecret: credentials.api_key_secret,
      accessToken: credentials.access_token,
      accessSecret: credentials.access_token_secret
    };
  } catch (error) {
    console.error('Error fetching Twitter credentials:', error);
    throw new Error('Failed to retrieve Twitter credentials');
  }
}

/**
 * Initialize Twitter client
 */
async function getTwitterClient() {
  if (!twitterClient) {
    const credentials = await getTwitterCredentials();
    twitterClient = new TwitterApi(credentials);
  }
  return twitterClient;
}

/**
 * Get next pending tweet from DynamoDB
 */
async function getNextPendingTweet() {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'status-scheduled_time-index',
      KeyConditionExpression: '#status = :status AND scheduled_time <= :now',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'pending',
        ':now': Date.now()
      },
      Limit: 1,
      ScanIndexForward: true // Get oldest first
    }));
    
    if (response.Items && response.Items.length > 0) {
      return response.Items[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    throw new Error(`Failed to fetch pending tweet: ${error.message}`);
  }
}

/**
 * Post tweet to Twitter
 */
async function postTweet(tweetText) {
  try {
    const client = await getTwitterClient();
    const result = await client.v2.tweet(tweetText);
    
    return {
      success: true,
      tweetId: result.data.id,
      tweetText: result.data.text
    };
  } catch (error) {
    console.error('Error posting tweet:', error);
    throw new Error(`Twitter API error: ${error.message}`);
  }
}

/**
 * Update tweet status in DynamoDB
 */
async function updateTweetStatus(tweetId, status, twitterTweetId = null, errorMessage = null) {
  const updateExpression = ['#status = :status', 'posted_time = :posted_time'];
  const expressionAttributeNames = { '#status': 'status' };
  const expressionAttributeValues = {
    ':status': status,
    ':posted_time': Date.now()
  };
  
  if (twitterTweetId) {
    updateExpression.push('twitter_tweet_id = :twitter_tweet_id');
    expressionAttributeValues[':twitter_tweet_id'] = twitterTweetId;
  }
  
  if (errorMessage) {
    updateExpression.push('error_message = :error_message');
    expressionAttributeValues[':error_message'] = errorMessage;
  }
  
  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { tweet_id: tweetId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));
  } catch (error) {
    console.error('Error updating tweet status:', error);
    // Don't throw - we don't want to fail the whole process if status update fails
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Tweet Publisher triggered at:', new Date().toISOString());
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get next pending tweet
    const tweet = await getNextPendingTweet();
    
    if (!tweet) {
      console.log('No pending tweets found');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No pending tweets to post',
          posted: false
        })
      };
    }
    
    console.log('Found pending tweet:', {
      tweet_id: tweet.tweet_id,
      article_title: tweet.article_title,
      sequence: tweet.sequence
    });
    
    // Post tweet to Twitter
    try {
      const result = await postTweet(tweet.tweet_text);
      
      console.log('Tweet posted successfully:', {
        tweet_id: tweet.tweet_id,
        twitter_tweet_id: result.tweetId
      });
      
      // Update status to 'posted'
      await updateTweetStatus(tweet.tweet_id, 'posted', result.tweetId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Tweet posted successfully',
          posted: true,
          tweet_id: tweet.tweet_id,
          twitter_tweet_id: result.tweetId,
          twitter_url: `https://twitter.com/user/status/${result.tweetId}`,
          article_title: tweet.article_title,
          sequence: tweet.sequence
        })
      };
      
    } catch (postError) {
      console.error('Error posting tweet:', postError);
      
      // Update status to 'failed'
      await updateTweetStatus(tweet.tweet_id, 'failed', null, postError.message);
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Failed to post tweet',
          posted: false,
          error: postError.message,
          tweet_id: tweet.tweet_id
        })
      };
    }
    
  } catch (error) {
    console.error('Error in tweet publisher:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Internal error in tweet publisher',
        error: error.message
      })
    };
  }
};

