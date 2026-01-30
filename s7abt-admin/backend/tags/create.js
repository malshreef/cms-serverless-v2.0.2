const db = require('./shared/db');
const response = require('./shared/response');
const validation = require('./shared/validation');
const { checkAuthorization } = require('./shared/authorize');

/**
 * Create a new tag
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('Create tag event:', JSON.stringify(event));

    // Check authorization - only admin and content_manager can create tags
    const authError = checkAuthorization(event, 'tags', 'create');
    if (authError) return authError;

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { name, slug } = body;

    // Validate required fields
    const errors = validation.validateRequired(body, ['name']);
    errors.push(...validation.validateLength(name, 'name', 1, 100));

    if (errors.length > 0) {
      return response.validationError(errors);
    }

    // Generate slug if not provided
    const finalSlug = slug || validation.generateSlug(name);

    // Check if tag already exists
    const existingTag = await db.queryOne(
      'SELECT s7b_tags_id FROM s7b_tags WHERE s7b_tags_name = ? OR s7b_tags_slug = ?',
      [name, finalSlug]
    );

    if (existingTag) {
      return response.validationError([{
        field: 'name',
        message: 'A tag with this name or slug already exists'
      }]);
    }

    // Insert tag
    const sql = `
      INSERT INTO s7b_tags (s7b_tags_name, s7b_tags_slug, s7b_tags_created_at)
      VALUES (?, ?, NOW())
    `;

    const result = await db.query(sql, [name, finalSlug]);

    return response.success({
      id: result.insertId,
      name,
      slug: finalSlug
    }, 201);

  } catch (error) {
    console.error('Error creating tag:', error);
    return response.error('Failed to create tag', 500, error.message);
  }
};

