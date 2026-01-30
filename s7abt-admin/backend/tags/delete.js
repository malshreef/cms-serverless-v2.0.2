const db = require('./shared/db');
const response = require('./shared/response');
const { checkAuthorization } = require('./shared/authorize');

/**
 * Delete a tag
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('Delete tag event:', JSON.stringify(event));

    // Check authorization - only admin and content_manager can delete tags
    const authError = checkAuthorization(event, 'tags', 'delete');
    if (authError) return authError;

    const tagId = event.pathParameters?.id;

    if (!tagId) {
      return response.validationError([{ field: 'id', message: 'Tag ID is required' }]);
    }

    // Check if tag exists
    const existingTag = await db.queryOne(
      'SELECT s7b_tags_id, s7b_tags_name FROM s7b_tags WHERE s7b_tags_id = ?',
      [tagId]
    );

    if (!existingTag) {
      return response.notFound('Tag');
    }

    // Delete tag associations first
    await db.query('DELETE FROM s7b_tags_item WHERE s7b_tags_id = ?', [tagId]);

    // Delete the tag
    await db.query('DELETE FROM s7b_tags WHERE s7b_tags_id = ?', [tagId]);

    return response.success({
      id: parseInt(tagId),
      message: 'Tag deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tag:', error);
    return response.error('Failed to delete tag', 500, error.message);
  }
};
