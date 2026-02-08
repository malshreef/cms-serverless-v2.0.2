const db = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  try {
    // Get query parameters
    const limit = parseInt(event.queryStringParameters?.limit) || 12;
    const offset = parseInt(event.queryStringParameters?.offset) || 0;

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return error('Limit must be between 1 and 100', 400);
    }

    if (offset < 0) {
      return error('Offset must be non-negative', 400);
    }

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM s7b_news WHERE s7b_news_active = 1 AND s7b_news_deleted_at IS NULL'
    );
    const total = countResult[0].total;

    // Get news with author info (use rawQuery for LIMIT/OFFSET)
    const news = await db.rawQuery(
      `
      SELECT
        n.s7b_news_id as id,
        n.s7b_news_title as title,
        n.s7b_news_brief as brief,
        n.s7b_news_image as image,
        n.s7b_news_logo as logo,
        n.s7b_news_add_date as createdAt,
        n.s7b_user_id as userId,
        u.s7b_user_name as authorName,
        u.s7b_user_image as authorImage
      FROM s7b_news n
      LEFT JOIN s7b_user u ON n.s7b_user_id = u.s7b_user_id
      WHERE n.s7b_news_active = 1 AND n.s7b_news_deleted_at IS NULL
      ORDER BY n.s7b_news_add_date DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    return success({
      news: news,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });

  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch news', 500, err.message);
  }
};
