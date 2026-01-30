const db = require('./shared/db');
const response = require('./shared/response');
const validation = require('./shared/validation');
const { checkAuthorization } = require('./shared/authorize');

/**
 * Update an existing tag
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('Update tag event:', JSON.stringify(event));

    // Check authorization - only admin and content_manager can update tags
    const authError = checkAuthorization(event, 'tags', 'update');
    if (authError) return authError;

    const tagId = event.pathParameters?.id;

    if (!tagId) {
      return response.validationError([{ field: 'id', message: 'Tag ID is required' }]);
    }

    // Check if tag exists
    const existingTag = await db.queryOne(
      'SELECT s7b_tags_id, s7b_tags_name, s7b_tags_slug FROM s7b_tags WHERE s7b_tags_id = ?',
      [tagId]
    );

    if (!existingTag) {
      return response.notFound('Tag');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { name, slug } = body;

    // Validate if provided
    const errors = [];
    if (name) {
      errors.push(...validation.validateLength(name, 'name', 1, 100));
    }

    if (errors.length > 0) {
      return response.validationError(errors);
    }

    // Check uniqueness if changed
    if (name && name !== existingTag.s7b_tags_name) {
      const existingName = await db.queryOne(
        'SELECT s7b_tags_id FROM s7b_tags WHERE s7b_tags_name = ? AND s7b_tags_id != ?',
        [name, tagId]
      );

      if (existingName) {
        return response.validationError([{
          field: 'name',
          message: 'A tag with this name already exists'
        }]);
      }
    }

    if (slug && slug !== existingTag.s7b_tags_slug) {
      const existingSlug = await db.queryOne(
        'SELECT s7b_tags_id FROM s7b_tags WHERE s7b_tags_slug = ? AND s7b_tags_id != ?',
        [slug, tagId]
      );

      if (existingSlug) {
        return response.validationError([{
          field: 'slug',
          message: 'A tag with this slug already exists'
        }]);
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('s7b_tags_name = ?');
      params.push(name);
    }
    if (slug !== undefined) {
      updates.push('s7b_tags_slug = ?');
      params.push(slug);
    }

    updates.push('s7b_tags_updated_at = NOW()');
    params.push(tagId);

    if (updates.length > 1) {
      const sql = `UPDATE s7b_tags SET ${updates.join(', ')} WHERE s7b_tags_id = ?`;
      await db.query(sql, params);
    }

    // Fetch updated tag
    const updatedTag = await db.queryOne(
      `SELECT 
        s7b_tags_id as id,
        s7b_tags_name as name,
        s7b_tags_slug as slug,
        s7b_tags_updated_at as updated_at
      FROM s7b_tags 
      WHERE s7b_tags_id = ?`,
      [tagId]
    );

    return response.success(updatedTag);

  } catch (error) {
    console.error('Error updating tag:', error);
    return response.error('Failed to update tag', 500, error.message);
  }
};

