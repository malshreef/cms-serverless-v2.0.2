const db = require('./shared/db');
const response = require('./shared/response');
const { authorizeWithOwnership } = require('./shared/authorize');

/**
 * Delete an article (soft delete)
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('Delete article event:', JSON.stringify(event));

    const articleId = event.pathParameters?.id;

    if (!articleId) {
      return response.validationError([{ field: 'id', message: 'Article ID is required' }]);
    }

    // Check if article exists
    const existingArticle = await db.queryOne(
      'SELECT s7b_article_id, s7b_article_title, s7b_user_id FROM s7b_article WHERE s7b_article_id = ? AND s7b_article_deleted_at IS NULL',
      [articleId]
    );

    if (!existingArticle) {
      return response.notFound('Article');
    }

    // Check authorization with ownership
    const auth = await authorizeWithOwnership(
      event,
      'articles',
      'delete',
      's7b_article',
      's7b_article_id',
      articleId
    );

    if (!auth.authorized) {
      return auth.response;
    }

    // Soft delete the article
    const sql = `
      UPDATE s7b_article 
      SET s7b_article_deleted_at = NOW()
      WHERE s7b_article_id = ? AND s7b_article_deleted_at IS NULL
    `;

    await db.query(sql, [articleId]);

    return response.success({
      id: parseInt(articleId),
      message: 'Article deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting article:', error);
    return response.error('Failed to delete article', 500, error.message);
  }
};

