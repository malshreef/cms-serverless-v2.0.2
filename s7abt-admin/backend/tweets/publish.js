const { TwitterApi } = require('twitter-api-v2');
const { query, queryOne } = require('./shared/db');
const { success, error, notFound } = require('./shared/response');
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
  // Note: Secret uses api_key_secret (not api_secret)
  const cleanCredentials = {
    appKey: sanitizeCredential(credentials.api_key),
    appSecret: sanitizeCredential(credentials.api_key_secret),
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

    // Check if already posted
    if (tweet.status === 'posted') {
      return error('Tweet has already been posted', 400);
    }

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
          // Try without hashtags
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
      const client = await getTwitterClient();
      const response = await client.v2.tweet(tweetText);

      console.log('Twitter API Response:', response);

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
          tweetId
        ]
      );

      return success({
        message: 'Tweet published successfully',
        tweet_id: tweetId,
        twitter_tweet_id: response.data.id,
        twitter_url: `https://twitter.com/i/web/status/${response.data.id}`
      });

    } catch (twitterErr) {
      console.error('Twitter API Error:', twitterErr);

      // Update database with failure
      await query(
        `UPDATE s7b_tweets SET
          s7b_tweet_status = 'failed',
          s7b_tweet_error_message = ?
        WHERE s7b_tweet_id = ?`,
        [
          twitterErr.message || 'Unknown Twitter API error',
          tweetId
        ]
      );

      return error('Failed to publish tweet to Twitter: ' + twitterErr.message, 500);
    }

  } catch (err) {
    console.error('Error publishing tweet:', err);
    return error('Failed to publish tweet: ' + err.message, 500);
  }
};
