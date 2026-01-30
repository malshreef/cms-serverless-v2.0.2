const db = require('./shared/db');
const { success, error } = require('./shared/response');

/**
 * List all news with filtering and pagination
 */
exports.handler = async (event) => {
  console.log('List news request:', JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};
    const {
      status, // 'all', 'active', 'inactive'
      search,
      page = 1,
      limit = 20,
      sortBy = 's7b_news_add_date',
      sortOrder = 'DESC'
    } = queryParams;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    // Filter by status
    if (status && status !== 'all') {
      whereConditions.push('s7b_news_active = ?');
      params.push(status === 'active' ? 1 : 0);
    }

    // Search in title and body
    if (search) {
      whereConditions.push('(s7b_news_title LIKE ? OR s7b_news_body LIKE ? OR s7b_news_brief LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM s7b_news
      ${whereClause}
    `;

    const countResult = await db.queryOne(countQuery, params);
    const total = countResult.total;

    // Get news list
    const query = `
      SELECT 
        n.s7b_news_id as id,
        n.s7b_news_title as title,
        n.s7b_news_brief as brief,
        n.s7b_news_body as body,
        n.s7b_news_image as image,
        n.s7b_news_logo as logo,
        n.s7b_news_active as active,
        n.s7b_news_add_date as addDate,
        n.s7b_news_show_width as showWidth,
        n.s7b_user_id as userId,
        u.s7b_user_name as authorName
      FROM s7b_news n
      LEFT JOIN s7b_user u ON n.s7b_user_id = u.s7b_user_id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    const news = await db.query(query, params);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return success({
      news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasMore
      }
    });

  } catch (err) {
    console.error('Error listing news:', err);
    return error('Failed to fetch news list', 500);
  }
};

