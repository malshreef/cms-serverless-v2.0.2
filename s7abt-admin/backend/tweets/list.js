const { query } = require('./shared/db');
const { success, error } = require('./shared/response');

/**
 * List tweets with filtering and pagination
 */
exports.handler = async (event) => {
  console.log('List Tweets Event:', JSON.stringify(event, null, 2));

  try {
    const params = event.queryStringParameters || {};

    // Filters
    const status = params.status; // pending, posted, failed
    const articleId = params.articleId;
    const search = params.search;

    // Pagination
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 50;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = ['s7b_tweet_deleted_at IS NULL'];
    const queryParams = [];

    if (status) {
      conditions.push('s7b_tweet_status = ?');
      queryParams.push(status);
    }

    if (articleId) {
      conditions.push('s7b_article_id = ?');
      queryParams.push(articleId);
    }

    if (search) {
      conditions.push('(s7b_tweet_text LIKE ? OR s7b_article_title LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM s7b_tweets WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;

    // Get tweets
    const tweets = await query(
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
      WHERE ${whereClause}
      ORDER BY s7b_tweet_scheduled_time ASC, s7b_tweet_created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      queryParams
    );

    // Parse JSON hashtags safely
    const tweetsWithParsedData = tweets.map(tweet => {
      let hashtags = [];
      if (tweet.hashtags) {
        try {
          hashtags = typeof tweet.hashtags === 'string' ? JSON.parse(tweet.hashtags) : tweet.hashtags;
        } catch (e) {
          hashtags = [];
        }
      }
      return { ...tweet, hashtags };
    });

    return success({
      tweets: tweetsWithParsedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Error listing tweets:', err);
    return error('Failed to list tweets: ' + err.message, 500);
  }
};
