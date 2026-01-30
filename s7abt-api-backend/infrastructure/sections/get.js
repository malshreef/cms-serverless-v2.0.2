const { getConnection } = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  let connection;
  
  try {
    // Get section ID from path parameters
    const sectionId = event.pathParameters?.id;
    
    if (!sectionId) {
      return error('Section ID is required', 400);
    }
    
    // Get query parameters for pagination
    const limit = parseInt(event.queryStringParameters?.limit) || 12;
    const offset = parseInt(event.queryStringParameters?.offset) || 0;
    
    // Get database connection
    connection = await getConnection();
    
    // Get section details
    const [sectionResult] = await connection.execute(
      `
      SELECT 
        s7b_section_id as id,
        s7b_section_title as title,
        s7b_section_description as description,
        s7b_section_logo as logo,
        s7b_section_order as displayOrder,
        s7b_section_group as groupName
      FROM s7b_section
      WHERE s7b_section_id = ? AND s7b_section_active = 1
      `,
      [sectionId]
    );
    
    if (sectionResult.length === 0) {
      return error('Section not found', 404);
    }
    
    const section = sectionResult[0];
    
    // Get total articles count for this section
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM s7b_article WHERE s7b_section_id = ? AND s7b_article_active = 1',
      [sectionId]
    );
    const total = countResult[0].total;
    
    // Get articles in this section
    const [articles] = await connection.execute(
      `
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_add_date as createdAt,
        u.s7b_user_name as authorName
      FROM s7b_article a
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE a.s7b_section_id = ? AND a.s7b_article_active = 1
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?
      `,
      [sectionId, limit, offset]
    );
    
    section.articles = articles;
    section.pagination = {
      offset,
      limit,
      total,
      hasMore: offset + limit < total
    };
    
    return success({ section });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch section', 500, err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
