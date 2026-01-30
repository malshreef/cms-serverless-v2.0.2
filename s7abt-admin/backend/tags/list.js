const db = require('./shared/db');
const response = require('./shared/response');

/**
 * List all tags
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('List tags event:', JSON.stringify(event));

    const sql = `
      SELECT 
        s7b_tags_id as id,
        s7b_tags_name as name,
        s7b_tags_slug as slug,
        s7b_tags_created_at as created_at,
        s7b_tags_updated_at as updated_at
      FROM s7b_tags
      ORDER BY s7b_tags_name ASC
    `;

    const tags = await db.query(sql);

    // Get article count for each tag
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const countResult = await db.queryOne(
          'SELECT COUNT(*) as count FROM s7b_tags_item WHERE s7b_tags_id = ?',
          [tag.id]
        );

        return {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          articleCount: countResult.count,
          createdAt: tag.created_at,
          updatedAt: tag.updated_at
        };
      })
    );

    return response.success({ tags: tagsWithCount });

  } catch (error) {
    console.error('Error listing tags:', error);
    return response.error('Failed to list tags', 500, error.message);
  }
};

