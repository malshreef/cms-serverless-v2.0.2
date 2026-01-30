const { getConnection } = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  let connection;
  
  try {
    // Get user ID from path parameters
    const userId = event.pathParameters?.id;
    
    if (!userId) {
      return error('User ID is required', 400);
    }
    
    // Get query parameters for pagination
    const limit = parseInt(event.queryStringParameters?.limit) || 12;
    const offset = parseInt(event.queryStringParameters?.offset) || 0;
    
    // Get database connection
    connection = await getConnection();
    
    // Verify user exists
    const [userCheck] = await connection.execute(
      'SELECT s7b_user_id FROM s7b_user WHERE s7b_user_id = ? AND s7b_user_active = 1',
      [userId]
    );
    
    if (userCheck.length === 0) {
      return error('User not found', 404);
    }
    
    // Get total articles count
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM s7b_article WHERE s7b_user_id = ? AND s7b_article_active = 1',
      [userId]
    );
    const total = countResult[0].total;
    
    // Get user's articles
    const [articles] = await connection.execute(
      `
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_add_date as createdAt,
        s.s7b_section_id as sectionId,
        s.s7b_section_title as sectionName
      FROM s7b_article a
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      WHERE a.s7b_user_id = ? AND a.s7b_article_active = 1
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );
    
    return success({
      articles,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch user articles', 500, err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
