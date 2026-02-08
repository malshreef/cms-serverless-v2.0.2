const { query, queryOne } = require('./shared/db');
const { success, error, notFound } = require('./shared/response');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable is not set');
}
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
const TWITTER_FUNCTION_NAME = process.env.TWITTER_FUNCTION_NAME || 's7abt-admin-twitter-publish-prod';

/**
 * Publish a tweet to Twitter/X
 */
exports.handler = async (event) => {
  console.log('Publish Tweet Event:', JSON.stringify(event, null, 2));

  try {
    const tweetId = event.pathParameters?.id;

    if (!tweetId) {
      return error('Tweet ID is required', 400);
    }

    // Fetch tweet from database
    const tweet = await queryOne(
      `SELECT
        s7b_tweet_id as tweet_id,
        s7b_tweet_text as tweet_text,
        s7b_tweet_status as status,
        s7b_tweet_hashtags as hashtags,
        s7b_article_url as article_url
      FROM s7b_tweets
      WHERE s7b_tweet_id = ? AND s7b_tweet_deleted_at IS NULL`,
      [tweetId]
    );

    if (!tweet) {
      return notFound('Tweet not found');
    }

    if (tweet.status === 'posted') {
      return error('Tweet has already been posted', 400);
    }

    try {
      // Prepare tweet text with hashtags
      let hashtags = [];
      if (tweet.hashtags) {
        try {
          hashtags = typeof tweet.hashtags === 'string' ? JSON.parse(tweet.hashtags) : tweet.hashtags;
        } catch (e) {
          hashtags = [];
        }
      }
      const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');

      let tweetText = tweet.tweet_text;

      // Add article URL if there's room
      if (tweet.article_url) {
        const potentialText = `${tweetText}\n\n${hashtagString}\n\n${tweet.article_url}`;
        if (potentialText.length <= 280) {
          tweetText = potentialText;
        } else {
          const withoutHashtags = `${tweetText}\n\n${tweet.article_url}`;
          if (withoutHashtags.length <= 280) {
            tweetText = withoutHashtags;
          }
        }
      } else if (hashtagString) {
        const withHashtags = `${tweetText}\n\n${hashtagString}`;
        if (withHashtags.length <= 280) {
          tweetText = withHashtags;
        }
      }

      // Invoke non-VPC Lambda to post to Twitter
      const twitterResult = await invokeTwitterLambda(tweetText);

      // Update database with success
      await query(
        `UPDATE s7b_tweets SET
          s7b_tweet_status = 'posted',
          s7b_tweet_posted_time = NOW(),
          s7b_tweet_twitter_id = ?,
          s7b_tweet_twitter_url = ?,
          s7b_tweet_error_message = NULL
        WHERE s7b_tweet_id = ?`,
        [twitterResult.tweet_id, twitterResult.tweet_url, tweetId]
      );

      return success({
        message: 'Tweet published successfully',
        tweet_id: tweetId,
        twitter_tweet_id: twitterResult.tweet_id,
        twitter_url: twitterResult.tweet_url
      });

    } catch (twitterErr) {
      console.error('Twitter publish error:', twitterErr);

      await query(
        `UPDATE s7b_tweets SET
          s7b_tweet_status = 'failed',
          s7b_tweet_error_message = ?
        WHERE s7b_tweet_id = ?`,
        [twitterErr.message || 'Unknown Twitter API error', tweetId]
      );

      return error('Failed to publish tweet to Twitter: ' + twitterErr.message, 500);
    }

  } catch (err) {
    console.error('Error publishing tweet:', err);
    return error('Failed to publish tweet: ' + err.message, 500);
  }
};

async function invokeTwitterLambda(tweetText) {
  const response = await lambdaClient.send(new InvokeCommand({
    FunctionName: TWITTER_FUNCTION_NAME,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({ tweetText }),
  }));

  const payload = JSON.parse(Buffer.from(response.Payload).toString());

  if (response.FunctionError) {
    throw new Error(payload.errorMessage || 'Twitter Lambda invocation failed');
  }

  return payload;
}
