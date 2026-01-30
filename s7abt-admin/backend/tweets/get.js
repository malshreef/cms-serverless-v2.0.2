const { queryOne } = require('./shared/db');
const { success, error, notFound } = require('./shared/response');

/**
 * Get a single tweet by ID
 */
exports.handler = async (event) => {
  console.log('Get Tweet Event:', JSON.stringify(event, null, 2));

  try {
    const tweetId = event.pathParameters?.id;

    if (!tweetId) {
      return error('Tweet ID is required', 400);
    }

    const tweet = await queryOne(
      `SELECT
        s7b_tweet_id as tweet_id,
        s7b_article_id as article_id,
        s7b_tweet_text as tweet_text,
        s7b_tweet_tone as tone,
        s7b_tweet_hashtags as hashtags,
        s7b_tweet_sequence as sequence,
        s7b_tweet_total_in_batch as total_in_batch,
        s7b_tweet_status as status,
        s7b_tweet_scheduled_time as scheduled_time,
        s7b_tweet_posted_time as posted_time,
        s7b_tweet_twitter_id as twitter_tweet_id,
        s7b_tweet_twitter_url as twitter_url,
        s7b_tweet_error_message as error_message,
        s7b_article_title as article_title,
        s7b_article_url as article_url,
        s7b_tweet_likes as likes,
        s7b_tweet_retweets as retweets,
        s7b_tweet_replies as replies,
        s7b_tweet_impressions as impressions,
        s7b_tweet_created_at as created_at,
        s7b_tweet_updated_at as updated_at
      FROM s7b_tweets
      WHERE s7b_tweet_id = ? AND s7b_tweet_deleted_at IS NULL`,
      [tweetId]
    );

    if (!tweet) {
      return notFound('Tweet not found');
    }

    // Parse JSON hashtags
    tweet.hashtags = tweet.hashtags ? JSON.parse(tweet.hashtags) : [];

    return success({ tweet });

  } catch (err) {
    console.error('Error getting tweet:', err);
    return error('Failed to get tweet: ' + err.message, 500);
  }
};
