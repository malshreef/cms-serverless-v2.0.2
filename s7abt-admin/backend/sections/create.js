const db = require('./shared/db');
const response = require('./shared/response');
const validation = require('./shared/validation');
const { checkAuthorization } = require('./shared/authorize');

/**
 * Create a new section
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('Create section event:', JSON.stringify(event));

    // Check authorization - only admin and content_manager can create sections
    const authError = checkAuthorization(event, 'sections', 'create');
    if (authError) return authError;

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { name } = body;

    // Validate required fields
    const errors = validation.validateRequired(body, ['name']);
    errors.push(...validation.validateLength(name, 'name', 1, 150));

    if (errors.length > 0) {
      return response.validationError(errors);
    }

    // Check if section name already exists
    const existingSection = await db.queryOne(
      'SELECT s7b_section_id FROM s7b_section WHERE s7b_section_title = ? AND s7b_section_active = 1',
      [name]
    );

    if (existingSection) {
      return response.validationError([{
        field: 'name',
        message: 'A section with this name already exists'
      }]);
    }

    // Get max order to add new section at the end
    const maxOrder = await db.queryOne(
      'SELECT MAX(s7b_section_order) as maxOrder FROM s7b_section'
    );
    const newOrder = (maxOrder?.maxOrder || 0) + 1;

    // Insert section using correct column names
    const sql = `
      INSERT INTO s7b_section (
        s7b_section_title,
        s7b_section_active,
        s7b_section_order
      )
      VALUES (?, 1, ?)
    `;

    const result = await db.query(sql, [name, newOrder]);

    return response.success({
      id: result.insertId,
      name
    }, 201);

  } catch (error) {
    console.error('Error creating section:', error);
    return response.error('Failed to create section', 500, error.message);
  }
};

