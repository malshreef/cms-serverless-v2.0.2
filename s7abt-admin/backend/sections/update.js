const db = require('./shared/db');
const response = require('./shared/response');
const validation = require('./shared/validation');
const { checkAuthorization } = require('./shared/authorize');

/**
 * Update an existing section
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('Update section event:', JSON.stringify(event));

    // Check authorization - only admin and content_manager can update sections
    const authError = checkAuthorization(event, 'sections', 'update');
    if (authError) return authError;

    const sectionId = event.pathParameters?.id;

    if (!sectionId) {
      return response.validationError([{ field: 'id', message: 'Section ID is required' }]);
    }

    // Check if section exists
    const existingSection = await db.queryOne(
      'SELECT s7b_section_id, s7b_section_title FROM s7b_section WHERE s7b_section_id = ? AND s7b_section_active = 1',
      [sectionId]
    );

    if (!existingSection) {
      return response.notFound('Section');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { name } = body;

    // Validate if provided
    const errors = [];
    if (name) {
      errors.push(...validation.validateLength(name, 'name', 1, 150));
    }

    if (errors.length > 0) {
      return response.validationError(errors);
    }

    // Check name uniqueness if changed
    if (name && name !== existingSection.s7b_section_title) {
      const existingName = await db.queryOne(
        'SELECT s7b_section_id FROM s7b_section WHERE s7b_section_title = ? AND s7b_section_id != ? AND s7b_section_active = 1',
        [name, sectionId]
      );

      if (existingName) {
        return response.validationError([{
          field: 'name',
          message: 'A section with this name already exists'
        }]);
      }
    }

    if (!name) {
      return response.validationError([{ field: 'name', message: 'Section name is required' }]);
    }

    // Update section
    const sql = `UPDATE s7b_section SET s7b_section_title = ? WHERE s7b_section_id = ?`;
    await db.query(sql, [name, sectionId]);

    // Fetch updated section
    const updatedSection = await db.queryOne(
      `SELECT
        s7b_section_id as id,
        s7b_section_title as name
      FROM s7b_section
      WHERE s7b_section_id = ?`,
      [sectionId]
    );

    return response.success({
      id: updatedSection.id,
      name: updatedSection.name
    });

  } catch (error) {
    console.error('Error updating section:', error);
    return response.error('Failed to update section', 500, error.message);
  }
};

