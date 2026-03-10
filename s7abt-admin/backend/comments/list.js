const db = require('./shared/db');
const { success, error } = require('./shared/response');

/**
 * List all comments with filtering and pagination
 */
exports.handler = async (event) => {
  console.log('List comments request:', JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};
    const {
      status, // 'all', 'pending', 'approved'
      articleId,
      search,
      page = 1,
      limit = 20,
      sortBy = 's7b_comment_add_date',
      sortOrder = 'DESC'
    } = queryParams;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['c.s7b_comment_deleted_at IS NULL'];
    let params = [];

    // Filter by status
    if (status === 'pending') {
      whereConditions.push('c.s7b_comment_active = 0');
    } else if (status === 'approved') {
      whereConditions.push('c.s7b_comment_active = 1');
    }

    // Filter by article
    if (articleId) {
      whereConditions.push('c.s7b_article_id = ?');
      params.push(articleId);
    }

    // Search in comment body and user name
    if (search) {
      whereConditions.push('(c.s7b_comment_body LIKE ? OR c.s7b_comment_user_name LIKE ? OR c.s7b_comment_user_email LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM s7b_comment c ${whereClause}`;
    const countResult = await db.queryOne(countQuery, params);
    const total = countResult.total;

    // Get comments list with article title
    const query = `
      SELECT
        c.s7b_comment_id as id,
        c.s7b_article_id as articleId,
        c.s7b_comment_user_name as userName,
        c.s7b_comment_user_email as userEmail,
        c.s7b_comment_body as body,
        c.s7b_comment_active as active,
        c.s7b_comment_add_date as addDate,
        a.s7b_article_title as articleTitle
      FROM s7b_comment c
      LEFT JOIN s7b_article a ON c.s7b_article_id = a.s7b_article_id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const comments = await db.rawQuery(query, params);

    const totalPages = Math.ceil(total / limit);

    return success({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });

  } catch (err) {
    console.error('Error listing comments:', err);
    return error('Failed to fetch comments list', 500);
  }
};
