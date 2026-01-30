const { query, queryOne } = require('./shared/db');
const { success, error, notFound } = require('./shared/response');

/**
 * Delete a tweet (soft delete)
 */
exports.handler = async (event) => {
  console.log('Delete Tweet Event:', JSON.stringify(event, null, 2));

  try {
    const tweetId = event.pathParameters?.id;

    if (!tweetId) {
      return error('Tweet ID is required', 400);
    }

    // Check if tweet exists
    const existing = await queryOne(
      'SELECT s7b_tweet_id, s7b_tweet_status FROM s7b_tweets WHERE s7b_tweet_id = ? AND s7b_tweet_deleted_at IS NULL',
      [tweetId]
    );

    if (!existing) {
      return notFound('Tweet not found');
    }

    // Prevent deletion of already posted tweets
    if (existing.s7b_tweet_status === 'posted') {
      return error('Cannot delete a tweet that has already been posted', 400);
    }

    // Soft delete
    await query(
      'UPDATE s7b_tweets SET s7b_tweet_deleted_at = NOW() WHERE s7b_tweet_id = ?',
      [tweetId]
    );

    return success({
      message: 'Tweet deleted successfully',
      tweet_id: tweetId
    });

  } catch (err) {
    console.error('Error deleting tweet:', err);
    return error('Failed to delete tweet: ' + err.message, 500);
  }
};
