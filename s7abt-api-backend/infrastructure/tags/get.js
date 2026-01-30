const { getConnection } = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  let connection;
  
  try {
    // Get tag ID from path parameters
    const tagId = event.pathParameters?.id;
    
    if (!tagId) {
      return error('Tag ID is required', 400);
    }
    
    // Get query parameters for pagination
    const limit = parseInt(event.queryStringParameters?.limit) || 12;
    const offset = parseInt(event.queryStringParameters?.offset) || 0;
    
    // Get database connection
    connection = await getConnection();
    
    // Get tag details
    const [tagResult] = await connection.execute(
      `
      SELECT 
        s7b_tags_id as id,
        s7b_tags_name as name
      FROM s7b_tags
      WHERE s7b_tags_id = ?
      `,
      [tagId]
    );
    
    if (tagResult.length === 0) {
      return error('Tag not found', 404);
    }
    
    const tag = tagResult[0];
    
    // Get articles with this tag
    const [articles] = await connection.execute(
      `
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_add_date as createdAt,
        s.s7b_section_title as sectionName,
        u.s7b_user_name as authorName
      FROM s7b_article a
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE ti.s7b_tags_id = ? AND a.s7b_article_active = 1
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?
      `,
      [tagId, limit, offset]
    );
    
    // Get news with this tag
    const [news] = await connection.execute(
      `
      SELECT 
        n.s7b_news_id as id,
        n.s7b_news_title as title,
        n.s7b_news_brief as brief,
        n.s7b_news_image as image,
        n.s7b_news_add_date as createdAt,
        u.s7b_user_name as authorName
      FROM s7b_news n
      INNER JOIN s7b_tags_item ti ON n.s7b_news_id = ti.s7b_news_id
      LEFT JOIN s7b_user u ON n.s7b_user_id = u.s7b_user_id
      WHERE ti.s7b_tags_id = ? AND n.s7b_news_active = 1
      ORDER BY n.s7b_news_add_date DESC
      LIMIT ? OFFSET ?
      `,
      [tagId, limit, offset]
    );
    
    tag.articles = articles;
    tag.news = news;
    tag.totalItems = articles.length + news.length;
    
    return success({ tag });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch tag', 500, err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
