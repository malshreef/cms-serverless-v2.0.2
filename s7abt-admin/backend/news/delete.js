const db = require('./shared/db');
const { success, error } = require('./shared/response');
const { authorizeWithOwnership } = require('./shared/authorize');

/**
 * Delete news item
 */
exports.handler = async (event) => {
  console.log('Delete news request:', JSON.stringify(event, null, 2));

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
      'delete',
      's7b_news',
      's7b_news_id',
      newsId
    );

    if (!auth.authorized) {
      return auth.response;
    }

    // Delete the news
    await db.query('DELETE FROM s7b_news WHERE s7b_news_id = ?', [newsId]);

    return success({
      message: 'News deleted successfully',
      id: newsId
    });

  } catch (err) {
    console.error('Error deleting news:', err);
    return error('Failed to delete news', 500);
  }
};

