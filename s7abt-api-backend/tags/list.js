const { getConnection } = require('./shared/db');
const { success, error } = require('./shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  let connection;
  
  try {
    // Get database connection
    connection = await getConnection();
    
    // Get status filter from query parameters (published, draft, all)
    // Default to 'published' for public-facing website
    const status = event.queryStringParameters?.status || 'published';
    
    // Validate status parameter
    const validStatuses = ['published', 'draft', 'all'];
    if (!validStatuses.includes(status)) {
      return error('Invalid status parameter. Must be one of: published, draft, all', 400);
    }
    
    // Build the WHERE clause based on status
    let articleWhereClause = '';
    if (status === 'published') {
      // Only count active/published articles
      articleWhereClause = 'AND a.s7b_article_active = 1';
    } else if (status === 'draft') {
      // Only count draft articles
      articleWhereClause = 'AND a.s7b_article_active = 0';
    }
    // If status === 'all', no WHERE clause is added
    
    // Get all tags with usage count
    // Note: We're joining with the articles table to apply the status filter
    const [tags] = await connection.execute(
      `
      SELECT 
        t.s7b_tags_id as id,
        t.s7b_tags_name as name,
        COUNT(DISTINCT CASE 
          WHEN ti.s7b_article_id IS NOT NULL AND a.s7b_article_id IS NOT NULL 
          THEN ti.s7b_article_id 
        END) as articlesCount,
        COUNT(DISTINCT ti.s7b_news_id) as newsCount,
        (
          COUNT(DISTINCT CASE 
            WHEN ti.s7b_article_id IS NOT NULL AND a.s7b_article_id IS NOT NULL 
            THEN ti.s7b_article_id 
          END) + 
          COUNT(DISTINCT ti.s7b_news_id)
        ) as totalUsage
      FROM s7b_tags t
      LEFT JOIN s7b_tags_item ti ON t.s7b_tags_id = ti.s7b_tags_id
      LEFT JOIN s7b_article a ON ti.s7b_article_id = a.s7b_article_id ${articleWhereClause}
      GROUP BY t.s7b_tags_id, t.s7b_tags_name
      ORDER BY totalUsage DESC, t.s7b_tags_name ASC
      `
    );
    
    return success({ 
      tags,
      filter: {
        status,
        description: status === 'published' ? 'Published articles only' : 
                    status === 'draft' ? 'Draft articles only' : 
                    'All articles'
      }
    });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch tags', 500, err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
