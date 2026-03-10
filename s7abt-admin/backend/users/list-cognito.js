const db = require('./shared/db');
const { success: successResponse, error: errorResponse, forbidden } = require('./shared/response');
const { checkAuthorization } = require('./shared/authorize');

/**
 * List Users with Cognito Integration
 *
 * Lists users from database (which are synced with Cognito)
 * Includes filtering by role and active status
 */
exports.handler = async (event) => {
  console.log('Listing users:', JSON.stringify(event, null, 2));

  try {
    // Check authorization - only admin and content_manager can list users
    const authError = checkAuthorization(event, 'users', 'list');
    if (authError) return authError;
    const queryParams = event.queryStringParameters || {};
    const {
      role,
      active,
      search,
      page = '1',
      limit = '20',
    } = queryParams;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause (s7b_user table has no deleted_at column)
    const conditions = ['1=1'];
    const values = [];

    if (role) {
      conditions.push('s7b_user_role = ?');
      values.push(role);
    }

    if (active !== undefined) {
      conditions.push('s7b_user_active = ?');
      values.push(parseInt(active, 10));
    }

    if (search) {
      conditions.push('(s7b_user_name LIKE ? OR s7b_user_email LIKE ?)');
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM s7b_user WHERE ${whereClause}`,
      values
    );
    const total = countResult.total;

    // Get users with LIMIT/OFFSET (use rawQuery for dynamic SQL)
    const users = await db.rawQuery(
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
      WHERE ${whereClause}
      ORDER BY s7b_user_created_at DESC
      LIMIT ? OFFSET ?`,
      [...values, limitNum, offset]
    );

    // Get article and news counts for each user
    for (const user of users) {
      const articleCount = await db.queryOne(
        'SELECT COUNT(*) as count FROM s7b_article WHERE s7b_user_id = ? AND s7b_article_deleted_at IS NULL',
        [user.id]
      );

      const newsCount = await db.queryOne(
        'SELECT COUNT(*) as count FROM s7b_news WHERE s7b_user_id = ? AND s7b_news_deleted_at IS NULL',
        [user.id]
      );

      user.articleCount = articleCount.count;
      user.newsCount = newsCount.count;
    }

    return successResponse({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });

  } catch (error) {
    console.error('Error listing users:', error);
    return errorResponse(error.message || 'Failed to list users', 500);
  }
};

