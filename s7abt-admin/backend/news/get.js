const db = require('./shared/db');
const { success, error } = require('./shared/response');

/**
 * Get single news item by ID
 */
exports.handler = async (event) => {
  console.log('Get news request:', JSON.stringify(event, null, 2));

  try {
    const newsId = event.pathParameters?.id;

    if (!newsId) {
      return error('News ID is required', 400);
    }

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
      WHERE n.s7b_news_id = ?
    `;

    const news = await db.queryOne(query, [newsId]);

    if (!news) {
      return error('News not found', 404);
    }

    return success({ news });

  } catch (err) {
    console.error('Error fetching news:', err);
    return error('Failed to fetch news', 500);
  }
};

