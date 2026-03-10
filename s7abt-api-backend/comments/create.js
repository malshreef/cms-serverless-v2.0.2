const db = require('../shared/db');
const { success, error, badRequest, notFound } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Create comment request:', JSON.stringify(event, null, 2));

  try {
    const articleId = event.pathParameters?.id;
    if (!articleId) {
      return badRequest('Article ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const { userName, email, commentBody } = body;

    // Validate required fields
    const errors = [];
    if (!userName || userName.trim() === '') errors.push('userName is required');
    if (!email || email.trim() === '') errors.push('email is required');
    if (!commentBody || commentBody.trim() === '') errors.push('commentBody is required');

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }

    if (userName && userName.length > 100) errors.push('userName must not exceed 100 characters');
    if (commentBody && commentBody.length > 5000) errors.push('commentBody must not exceed 5000 characters');

    if (errors.length > 0) {
      return badRequest(errors.join(', '));
    }

    // Verify article exists and is active
    const article = await db.queryOne(
      'SELECT s7b_article_id FROM s7b_article WHERE s7b_article_id = ? AND s7b_article_active = 1 AND s7b_article_deleted_at IS NULL',
      [articleId]
    );
    if (!article) {
      return notFound('Article');
    }

    // Insert comment (active=0, pending moderation)
    const sql = `
      INSERT INTO s7b_comment (s7b_article_id, s7b_comment_user_name, s7b_comment_user_email, s7b_comment_body, s7b_comment_add_date, s7b_comment_active)
      VALUES (?, ?, ?, ?, NOW(), 0)
    `;
    const result = await db.query(sql, [articleId, userName.trim(), email.trim(), commentBody.trim()]);

    return success({ id: result.insertId, message: 'Comment submitted for review' }, 201);
  } catch (err) {
    console.error('Error creating comment:', err);
    return error('Failed to submit comment', 500, err.message);
  }
};
