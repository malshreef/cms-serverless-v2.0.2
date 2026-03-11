const { query } = require('./shared/db');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable is not set');
}
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
const TWITTER_FUNCTION_NAME = process.env.TWITTER_FUNCTION_NAME || 's7abt-tweets-twitter-publish';

const MAX_RETRIES = 5;
const TRANSIENT_ERROR_CODES = [500, 502, 503, 504];

/**
 * Check if an error is transient (worth retrying)
 */
function isTransientError(errorMessage) {
  if (!errorMessage) return false;
  return TRANSIENT_ERROR_CODES.some(code => errorMessage.includes(`code ${code}`))
    || errorMessage.includes('ETIMEDOUT')
    || errorMessage.includes('ECONNRESET')
    || errorMessage.includes('socket hang up')
    || errorMessage.includes('Lambda invocation failed');
}

/**
 * Parse retry count from error_message field.
 * Format: "[retry:N] error message"
 */
function parseRetryCount(errorMessage) {
  if (!errorMessage) return 0;
  const match = errorMessage.match(/^\[retry:(\d+)\]/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Format error message with retry count
 */
function formatErrorWithRetry(retryCount, errorMessage) {
  return `[retry:${retryCount}] ${errorMessage}`;
}

/**
 * Scheduled Lambda handler - Runs daily at 3:00 PM Riyadh (12:00 UTC)
 * Publishes all pending tweets that are scheduled for today or earlier.
 * Uses split-Lambda pattern: this VPC Lambda handles DB, invokes non-VPC Lambda for Twitter API.
 *
 * Retry logic: transient errors (5xx, timeouts) keep status as 'pending'
 * and retry up to MAX_RETRIES times. Permanent errors mark as 'failed' immediately.
 */
exports.handler = async (event) => {
  console.log('Scheduled Tweet Publisher Event:', JSON.stringify(event, null, 2));

  try {
    // Fetch tweets that are ready to be published (pending status)
    const now = new Date();
    const tweets = await query(
      `SELECT
        s7b_tweet_id as tweet_id,
        s7b_tweet_text as tweet_text,
        s7b_tweet_hashtags as hashtags,
        s7b_article_url as article_url,
        s7b_tweet_scheduled_time as scheduled_time,
        s7b_tweet_error_message as error_message
      FROM s7b_tweets
      WHERE s7b_tweet_status = 'pending'
        AND s7b_tweet_deleted_at IS NULL
        AND s7b_tweet_scheduled_time <= ?
      ORDER BY s7b_tweet_scheduled_time ASC
      LIMIT 10`,
      [now]
    );

    console.log(`Found ${tweets.length} tweets ready for publishing`);

    if (tweets.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No tweets to publish',
          published: 0
        })
      };
    }

    const results = {
      published: 0,
      failed: 0,
      retried: 0,
      errors: []
    };

    // Publish each tweet via non-VPC Twitter Lambda
    for (const tweet of tweets) {
      try {
        // Prepare tweet text with hashtags
        const hashtags = tweet.hashtags ? JSON.parse(tweet.hashtags) : [];
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

        // Post to Twitter via non-VPC Lambda
        console.log(`Publishing tweet ${tweet.tweet_id}...`);
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
          [
            twitterResult.tweet_id,
            twitterResult.tweet_url,
            tweet.tweet_id
          ]
        );

        results.published++;
        console.log(`Successfully published tweet ${tweet.tweet_id} to Twitter: ${twitterResult.tweet_id}`);

        // Rate limiting: wait 1 second between tweets
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (tweetErr) {
        console.error(`Failed to publish tweet ${tweet.tweet_id}:`, tweetErr);

        const errorMsg = tweetErr.message || 'Unknown Twitter API error';
        const currentRetryCount = parseRetryCount(tweet.error_message) + 1;

        if (isTransientError(errorMsg) && currentRetryCount < MAX_RETRIES) {
          // Transient error - keep as pending for retry next run
          await query(
            `UPDATE s7b_tweets SET
              s7b_tweet_error_message = ?
            WHERE s7b_tweet_id = ?`,
            [
              formatErrorWithRetry(currentRetryCount, errorMsg),
              tweet.tweet_id
            ]
          );

          results.retried++;
          console.log(`Tweet ${tweet.tweet_id} will retry (attempt ${currentRetryCount}/${MAX_RETRIES}): ${errorMsg}`);
        } else {
          // Permanent error or max retries exceeded - mark as failed
          const failReason = currentRetryCount >= MAX_RETRIES
            ? `Max retries (${MAX_RETRIES}) exceeded. Last error: ${errorMsg}`
            : errorMsg;

          await query(
            `UPDATE s7b_tweets SET
              s7b_tweet_status = 'failed',
              s7b_tweet_error_message = ?
            WHERE s7b_tweet_id = ?`,
            [
              failReason,
              tweet.tweet_id
            ]
          );

          results.failed++;
          console.log(`Tweet ${tweet.tweet_id} permanently failed: ${failReason}`);
        }

        results.errors.push({
          tweet_id: tweet.tweet_id,
          error: errorMsg,
          retry: currentRetryCount < MAX_RETRIES && isTransientError(errorMsg)
        });
      }
    }

    console.log('Scheduled publishing complete:', results);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Published ${results.published}, retried ${results.retried}, failed ${results.failed}`,
        ...results
      })
    };

  } catch (err) {
    console.error('Scheduler error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Scheduler failed: ' + err.message
      })
    };
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
