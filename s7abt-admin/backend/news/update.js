const db = require('./shared/db');
const { success, error } = require('./shared/response');
const { authorizeWithOwnership, filterStatusChange } = require('./shared/authorize');

/**
 * Update existing news item
 */
exports.handler = async (event) => {
  console.log('Update news request:', JSON.stringify(event, null, 2));

  try {
    const newsId = event.pathParameters?.id;

    if (!newsId) {
      return error('News ID is required', 400);
    }

    // Check if news exists
    const existing = await db.queryOne(
      'SELECT s7b_news_id, s7b_user_id FROM s7b_news WHERE s7b_news_id = ?',
      [newsId]
    );

    if (!existing) {
      return error('News not found', 404);
    }

    // Check authorization with ownership
    const auth = await authorizeWithOwnership(
      event,
      'news',
      'update',
      's7b_news',
      's7b_news_id',
      newsId
    );

    if (!auth.authorized) {
      return auth.response;
    }

    const body = JSON.parse(event.body || '{}');
    const {
      title,
      brief,
      body: newsBody,
      image,
      logo,
      active,
      showWidth
    } = body;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      if (title.length > 100) {
        return error('Title must be 100 characters or less', 400);
      }
      updates.push('s7b_news_title = ?');
      params.push(title);
    }

    if (brief !== undefined) {
      if (brief.length > 200) {
        return error('Brief must be 200 characters or less', 400);
      }
      updates.push('s7b_news_brief = ?');
      params.push(brief);
    }

    if (newsBody !== undefined) {
      if (newsBody.length > 2000) {
        return error('Body must be 2000 characters or less', 400);
      }
      updates.push('s7b_news_body = ?');
      params.push(newsBody);
    }

    if (image !== undefined) {
      updates.push('s7b_news_image = ?');
      params.push(image);
    }

    if (logo !== undefined) {
      updates.push('s7b_news_logo = ?');
      params.push(logo);
    }

    if (active !== undefined) {
      // Filter active status based on publish permission
      const allowedActive = filterStatusChange(event, 'news', active === 1 ? 'published' : 'draft') === 'published' ? 1 : 0;
      updates.push('s7b_news_active = ?');
      params.push(allowedActive);
    }

    if (showWidth !== undefined) {
      updates.push('s7b_news_show_width = ?');
      params.push(showWidth);
    }

    if (updates.length === 0) {
      return error('No fields to update', 400);
    }

    // Add newsId to params
    params.push(newsId);

    const query = `
      UPDATE s7b_news
      SET ${updates.join(', ')}
      WHERE s7b_news_id = ?
    `;

    await db.query(query, params);

    // Fetch updated news
    const [updated] = await db.query(`
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
    `, [newsId]);

    return success({
      message: 'News updated successfully',
      news: updated[0]
    });

  } catch (err) {
    console.error('Error updating news:', err);
    return error('Failed to update news', 500);
  }
};

