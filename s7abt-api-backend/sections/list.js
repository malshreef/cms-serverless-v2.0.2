const { getConnection } = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  let connection;
  
  try {
    // Get database connection
    connection = await getConnection();
    
    // Get all active sections with article count
    const [sections] = await connection.execute(
      `
      SELECT 
        s.s7b_section_id as id,
        s.s7b_section_title as title,
        s.s7b_section_description as description,
        s.s7b_section_logo as logo,
        s.s7b_section_order as displayOrder,
        s.s7b_section_group as groupName,
        COUNT(DISTINCT a.s7b_article_id) as articlesCount
      FROM s7b_section s
      LEFT JOIN s7b_article a ON s.s7b_section_id = a.s7b_section_id AND a.s7b_article_active = 1
      WHERE s.s7b_section_active = 1
      GROUP BY s.s7b_section_id
      ORDER BY s.s7b_section_order ASC, s.s7b_section_title ASC
      `
    );
    
    return success({ sections });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch sections', 500, err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
