const { TwitterApi } = require('twitter-api-v2');
const { query } = require('./shared/db');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let twitterClient = null;
let secretCache = null;
const SECRET_CACHE_TTL = 300000; // 5 minutes
let secretCacheTime = 0;

/**
 * Sanitize credential string - removes all whitespace and hidden characters
 * This handles issues with copy/paste from web pages that may include
 * non-breaking spaces, zero-width characters, or other Unicode whitespace
 */
function sanitizeCredential(value) {
  if (!value || typeof value !== 'string') return '';

  return value
    // Remove all types of whitespace including Unicode variants
    .replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF\r\n\t]/g, '')
    // Remove any quotes that might have been accidentally included
    .replace(/^["']|["']$/g, '')
    .trim();
}

/**
 * Get Twitter API credentials from Secrets Manager
 */
async function getTwitterCredentials() {
  const now = Date.now();

  if (secretCache && (now - secretCacheTime) < SECRET_CACHE_TTL) {
    return secretCache;
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'me-central-1' });
  const secretName = process.env.TWITTER_SECRET_NAME || 's7abt/twitter/credentials';

  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    const secret = JSON.parse(response.SecretString);
    secretCache = secret;
    secretCacheTime = now;

    return secret;
  } catch (err) {
    console.error('Error fetching Twitter credentials:', err);
    throw new Error('Failed to retrieve Twitter API credentials');
  }
}

/**
 * Initialize Twitter client
 */
async function getTwitterClient() {
  // Always create a fresh client to avoid stale credentials
  const credentials = await getTwitterCredentials();

  // Sanitize credentials to remove whitespace and hidden characters
  const cleanCredentials = {
    appKey: sanitizeCredential(credentials.api_key),
    appSecret: sanitizeCredential(credentials.api_secret),
    accessToken: sanitizeCredential(credentials.access_token),
    accessSecret: sanitizeCredential(credentials.access_token_secret),
  };

  // Validate credentials exist
  if (!cleanCredentials.appKey || !cleanCredentials.appSecret ||
      !cleanCredentials.accessToken || !cleanCredentials.accessSecret) {
    throw new Error('Missing Twitter API credentials in Secrets Manager');
  }

  console.log('Initializing Twitter client with credentials:', {
    appKey: cleanCredentials.appKey.substring(0, 5) + '...',
    appKeyLength: cleanCredentials.appKey.length,
    appSecretLength: cleanCredentials.appSecret.length,
    accessTokenLength: cleanCredentials.accessToken.length,
    accessSecretLength: cleanCredentials.accessSecret.length,
    hasAppSecret: !!cleanCredentials.appSecret,
    hasAccessToken: !!cleanCredentials.accessToken,
    hasAccessSecret: !!cleanCredentials.accessSecret,
  });

  return new TwitterApi(cleanCredentials);
}

/**
 * Scheduled Lambda handler - Runs daily at 3:00 PM Riyadh (12:00 UTC)
 * Publishes all pending tweets that are scheduled for today or earlier
 */
exports.handler = async (event) => {
  console.log('Scheduled Tweet Publisher Event:', JSON.stringify(event, null, 2));

  try {
    // Fetch tweets that are ready to be published
    const now = new Date();
    const tweets = await query(
      `SELECT
        s7b_tweet_id as tweet_id,
        s7b_tweet_text as tweet_text,
        s7b_tweet_hashtags as hashtags,
        s7b_article_url as article_url,
        s7b_tweet_scheduled_time as scheduled_time
      FROM s7b_tweets
      WHERE s7b_tweet_status = 'pending'
        AND s7b_tweet_deleted_at IS NULL
        AND s7b_tweet_scheduled_time <= ?
      ORDER BY s7b_tweet_scheduled_time ASC
      LIMIT 10`,  // Process up to 10 tweets per run to avoid rate limits
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

    // Initialize Twitter client once
    const client = await getTwitterClient();

    const results = {
      published: 0,
      failed: 0,
      errors: []
    };

    // Publish each tweet
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

        // Post to Twitter
        console.log(`Publishing tweet ${tweet.tweet_id}...`);
        const response = await client.v2.tweet(tweetText);

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
            response.data.id,
            `https://twitter.com/i/web/status/${response.data.id}`,
            tweet.tweet_id
          ]
        );

        results.published++;
        console.log(`Successfully published tweet ${tweet.tweet_id} to Twitter: ${response.data.id}`);

        // Rate limiting: wait 1 second between tweets
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (tweetErr) {
        console.error(`Failed to publish tweet ${tweet.tweet_id}:`, tweetErr);

        // Update database with failure
        await query(
          `UPDATE s7b_tweets SET
            s7b_tweet_status = 'failed',
            s7b_tweet_error_message = ?
          WHERE s7b_tweet_id = ?`,
          [
            tweetErr.message || 'Unknown Twitter API error',
            tweet.tweet_id
          ]
        );

        results.failed++;
        results.errors.push({
          tweet_id: tweet.tweet_id,
          error: tweetErr.message
        });
      }
    }

    console.log('Scheduled publishing complete:', results);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Published ${results.published} tweets, ${results.failed} failed`,
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
