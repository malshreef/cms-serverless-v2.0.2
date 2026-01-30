const { getConnection } = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  let connection;
  
  try {
    // Get news ID from path parameters
    const newsId = event.pathParameters?.id;
    
    if (!newsId) {
      return error('News ID is required', 400);
    }
    
    // Get database connection
    connection = await getConnection();
    
    // Get news details - simple query like legacy PHP code
    const [newsResult] = await connection.execute(
      `SELECT * FROM s7b_news WHERE s7b_news_active = 1 AND s7b_news_id = ?`,
      [newsId]
    );
    
    if (newsResult.length === 0) {
      return error('News not found', 404);
    }
    
    const newsItem = newsResult[0];
    
    // Get tags for this news
    const [tags] = await connection.execute(
      `
      SELECT 
        t.s7b_tags_id as id,
        t.s7b_tags_name as name
      FROM s7b_tags t
      INNER JOIN s7b_tags_item ti ON t.s7b_tags_id = ti.s7b_tags_id
      WHERE ti.s7b_news_id = ?
      `,
      [newsId]
    );
    
    newsItem.tags = tags;
    
    // Note: News doesn't have comments in this system
    // Comments are only for articles
    
    return success({ news: newsItem });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch news', 500, err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
