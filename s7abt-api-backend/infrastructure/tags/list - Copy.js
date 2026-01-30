const { getConnection } = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  let connection;
  
  try {
    // Get database connection
    connection = await getConnection();
    
    // Get all tags with usage count
    const [tags] = await connection.execute(
      `
      SELECT 
        t.s7b_tags_id as id,
        t.s7b_tags_name as name,
        COUNT(DISTINCT ti.s7b_article_id) as articlesCount,
        COUNT(DISTINCT ti.s7b_news_id) as newsCount,
        (COUNT(DISTINCT ti.s7b_article_id) + COUNT(DISTINCT ti.s7b_news_id)) as totalUsage
      FROM s7b_tags t
      LEFT JOIN s7b_tags_item ti ON t.s7b_tags_id = ti.s7b_tags_id
      GROUP BY t.s7b_tags_id
      ORDER BY totalUsage DESC, t.s7b_tags_name ASC
      `
    );
    
    return success({ tags });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch tags', 500, err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
