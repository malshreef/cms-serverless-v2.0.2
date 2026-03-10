const db = require('./shared/db');
const { success: successResponse, error: errorResponse } = require('./shared/response');

/**
 * Get Single User
 *
 * Retrieves a single user by ID from the database
 */
exports.handler = async (event) => {
  console.log('Getting user:', JSON.stringify(event, null, 2));

  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    // Get user from database
    const user = await db.queryOne(
      `SELECT
        s7b_user_id as id,
        s7b_user_email as email,
        s7b_user_name as name,
        s7b_user_brief as brief,
        s7b_user_role as role,
        s7b_user_active as active,
        s7b_user_image as image,
        s7b_user_twitter as twitter,
        s7b_user_facebook as facebook,
        s7b_user_linkedin as linkedin,
        s7b_user_cognito_id as cognitoId,
        s7b_user_created_at as createdAt
      FROM s7b_user
      WHERE s7b_user_id = ?`,
      [userId]
    );

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Get article and news counts
    const articleCount = await db.queryOne(
      'SELECT COUNT(*) as count FROM s7b_article WHERE s7b_user_id = ? AND s7b_article_deleted_at IS NULL',
      [userId]
    );

    const newsCount = await db.queryOne(
      'SELECT COUNT(*) as count FROM s7b_news WHERE s7b_user_id = ? AND s7b_news_deleted_at IS NULL',
      [userId]
    );

    user.articleCount = articleCount.count;
    user.newsCount = newsCount.count;

    return successResponse({
      user,
    });

  } catch (error) {
    console.error('Error getting user:', error);
    return errorResponse(error.message || 'Failed to get user', 500);
  }
};
