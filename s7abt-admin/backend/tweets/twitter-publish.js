const { TwitterApi } = require('twitter-api-v2');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let secretCache = null;
let secretCacheTime = 0;
const SECRET_CACHE_TTL = 300000;

function sanitizeCredential(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF\r\n\t]/g, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}

async function getTwitterCredentials() {
  const now = Date.now();
  if (secretCache && (now - secretCacheTime) < SECRET_CACHE_TTL) {
    return secretCache;
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const secretName = process.env.TWITTER_SECRET_NAME;

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  secretCache = JSON.parse(response.SecretString);
  secretCacheTime = now;
  return secretCache;
}

/**
 * Non-VPC Lambda: Posts a tweet to Twitter/X and returns the result
 */
exports.handler = async (event) => {
  const { tweetText } = event;

  if (!tweetText) {
    throw new Error('tweetText is required');
  }

  const credentials = await getTwitterCredentials();

  const cleanCredentials = {
    appKey: sanitizeCredential(credentials.api_key),
    appSecret: sanitizeCredential(credentials.api_key_secret),
    accessToken: sanitizeCredential(credentials.access_token),
    accessSecret: sanitizeCredential(credentials.access_token_secret),
  };

  if (!cleanCredentials.appKey || !cleanCredentials.appSecret ||
      !cleanCredentials.accessToken || !cleanCredentials.accessSecret) {
    throw new Error('Missing Twitter API credentials in Secrets Manager');
  }

  console.log('Posting tweet to Twitter/X...');
  const client = new TwitterApi(cleanCredentials);
  const response = await client.v2.tweet(tweetText);

  console.log('Tweet posted successfully:', response.data.id);

  return {
    tweet_id: response.data.id,
    tweet_url: `https://twitter.com/i/web/status/${response.data.id}`
  };
};
