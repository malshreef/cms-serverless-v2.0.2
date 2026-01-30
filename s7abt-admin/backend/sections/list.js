const db = require('./shared/db');
const response = require('./shared/response');

/**
 * List all sections
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('List sections event:', JSON.stringify(event));

    const sql = `
      SELECT
        s7b_section_id as id,
        s7b_section_title as name
      FROM s7b_section
      WHERE s7b_section_active = 1
      ORDER BY s7b_section_order ASC, s7b_section_title ASC
    `;

    const sections = await db.query(sql);

    // Get article count for each section
    const sectionsWithCount = await Promise.all(
      sections.map(async (section) => {
        const countResult = await db.queryOne(
          'SELECT COUNT(*) as count FROM s7b_article WHERE s7b_section_id = ? AND s7b_article_deleted_at IS NULL',
          [section.id]
        );

        return {
          id: section.id,
          name: section.name,
          articleCount: countResult.count
        };
      })
    );

    return response.success({ sections: sectionsWithCount });

  } catch (error) {
    console.error('Error listing sections:', error);
    return response.error('Failed to list sections', 500, error.message);
  }
};

