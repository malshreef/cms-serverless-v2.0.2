const db = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  try {
    // Get user ID from path parameters
    const userId = event.pathParameters?.id;

    if (!userId) {
      return error('User ID is required', 400);
    }

    // Get user details (excluding password)
    const userResult = await db.query(
      `
      SELECT
        s7b_user_id as id,
        s7b_user_username as username,
        s7b_user_name as name,
        s7b_user_brief as brief,
        s7b_user_image as image,
        s7b_user_twitter as twitter,
        s7b_user_facebook as facebook,
        s7b_user_linkedin as linkedin,
        s7b_user_admin as isAdmin
      FROM s7b_user
      WHERE s7b_user_id = ? AND s7b_user_active = 1
      `,
      [userId]
    );

    if (userResult.length === 0) {
      return error('User not found', 404);
    }

    const user = userResult[0];

    // Get user's articles count
    const articlesCount = await db.query(
      'SELECT COUNT(*) as total FROM s7b_article WHERE s7b_user_id = ? AND s7b_article_active = 1 AND s7b_article_deleted_at IS NULL',
      [userId]
    );
    user.articlesCount = articlesCount[0].total;

    // Get user's news count
    const newsCount = await db.query(
      'SELECT COUNT(*) as total FROM s7b_news WHERE s7b_user_id = ? AND s7b_news_active = 1 AND s7b_news_deleted_at IS NULL',
      [userId]
    );
    user.newsCount = newsCount[0].total;

    return success({ user });

  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch user', 500, err.message);
  }
};
