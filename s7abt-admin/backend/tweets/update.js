const { query, queryOne } = require('./shared/db');
const { success, error, notFound, validationError } = require('./shared/response');

/**
 * Update a tweet
 */
exports.handler = async (event) => {
  console.log('Update Tweet Event:', JSON.stringify(event, null, 2));

  try {
    const tweetId = event.pathParameters?.id;

    if (!tweetId) {
      return error('Tweet ID is required', 400);
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { tweet_text, tone, hashtags, scheduled_time, status } = body;

    // Validate
    if (!tweet_text && !tone && !hashtags && !scheduled_time && !status) {
      return validationError('At least one field must be provided for update');
    }

    // Check if tweet exists
    const existing = await queryOne(
      'SELECT s7b_tweet_id FROM s7b_tweets WHERE s7b_tweet_id = ? AND s7b_tweet_deleted_at IS NULL',
      [tweetId]
    );

    if (!existing) {
      return notFound('Tweet not found');
    }

    // Build UPDATE query dynamically
    const updates = [];
    const params = [];

    if (tweet_text !== undefined) {
      updates.push('s7b_tweet_text = ?');
      params.push(tweet_text);
    }

    if (tone !== undefined) {
      updates.push('s7b_tweet_tone = ?');
      params.push(tone);
    }

    if (hashtags !== undefined) {
      updates.push('s7b_tweet_hashtags = ?');
      params.push(JSON.stringify(hashtags));
    }

    if (scheduled_time !== undefined) {
      updates.push('s7b_tweet_scheduled_time = ?');
      params.push(scheduled_time);
    }

    if (status !== undefined) {
      updates.push('s7b_tweet_status = ?');
      params.push(status);
    }

    params.push(tweetId);

    await query(
      `UPDATE s7b_tweets SET ${updates.join(', ')} WHERE s7b_tweet_id = ?`,
      params
    );

    // Fetch updated tweet
    const updated = await queryOne(
      `SELECT
        s7b_tweet_id as tweet_id,
        s7b_tweet_text as tweet_text,
        s7b_tweet_tone as tone,
        s7b_tweet_hashtags as hashtags,
        s7b_tweet_status as status,
        s7b_tweet_scheduled_time as scheduled_time
      FROM s7b_tweets
      WHERE s7b_tweet_id = ?`,
      [tweetId]
    );

    updated.hashtags = updated.hashtags ? JSON.parse(updated.hashtags) : [];

    return success({
      message: 'Tweet updated successfully',
      tweet: updated
    });

  } catch (err) {
    console.error('Error updating tweet:', err);
    return error('Failed to update tweet: ' + err.message, 500);
  }
};
