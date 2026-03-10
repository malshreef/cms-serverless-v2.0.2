const db = require('./shared/db');
const { success, error, badRequest, notFound } = require('./shared/response');

/**
 * Update comment status (approve/reject)
 */
exports.handler = async (event) => {
  console.log('Update comment status request:', JSON.stringify(event, null, 2));

  try {
    const commentId = event.pathParameters?.id;
    if (!commentId) {
      return badRequest('Comment ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const { active } = body;

    if (active === undefined || (active !== 0 && active !== 1)) {
      return badRequest('active must be 0 or 1');
    }

    // Verify comment exists and is not deleted
    const comment = await db.queryOne(
      'SELECT s7b_comment_id FROM s7b_comment WHERE s7b_comment_id = ? AND s7b_comment_deleted_at IS NULL',
      [commentId]
    );

    if (!comment) {
      return notFound('Comment');
    }

    await db.query(
      'UPDATE s7b_comment SET s7b_comment_active = ? WHERE s7b_comment_id = ?',
      [active, commentId]
    );

    return success({
      id: parseInt(commentId),
      active,
      message: active === 1 ? 'Comment approved' : 'Comment rejected'
    });

  } catch (err) {
    console.error('Error updating comment status:', err);
    return error('Failed to update comment status', 500, err.message);
  }
};
