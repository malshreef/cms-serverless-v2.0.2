const db = require('./shared/db');
const { success, error, badRequest, notFound } = require('./shared/response');

/**
 * Soft delete a comment
 */
exports.handler = async (event) => {
  console.log('Delete comment request:', JSON.stringify(event, null, 2));

  try {
    const commentId = event.pathParameters?.id;
    if (!commentId) {
      return badRequest('Comment ID is required');
    }

    // Verify comment exists and is not already deleted
    const comment = await db.queryOne(
      'SELECT s7b_comment_id FROM s7b_comment WHERE s7b_comment_id = ? AND s7b_comment_deleted_at IS NULL',
      [commentId]
    );

    if (!comment) {
      return notFound('Comment');
    }

    await db.query(
      'UPDATE s7b_comment SET s7b_comment_deleted_at = NOW() WHERE s7b_comment_id = ?',
      [commentId]
    );

    return success({ id: parseInt(commentId), message: 'Comment deleted' });

  } catch (err) {
    console.error('Error deleting comment:', err);
    return error('Failed to delete comment', 500, err.message);
  }
};
