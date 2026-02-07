const mysql = require('mysql2/promise');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const client = new SecretsManagerClient({ region: 'us-east-1' });
    const secretArn = process.env.DB_SECRET_ARN || process.env.DB_SECRET_NAME || process.env.DATABASE_SECRET_ARN;
    const response = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
    const credentials = JSON.parse(response.SecretString);

    const connection = await mysql.createConnection({
      host: credentials.host,
      port: credentials.port || 3306,
      user: credentials.username,
      password: credentials.password,
      database: credentials.dbname || credentials.database,
      charset: 'utf8mb4'
    });

    // Get query parameters
    const tagId = event.queryStringParameters?.tagId;
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const pageSize = parseInt(event.queryStringParameters?.pageSize) || 15;
    const offset = (page - 1) * pageSize;

    if (!tagId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'tagId is required' })
      };
    }

    // Get tag info
    const [tagRows] = await connection.query(
      'SELECT s7b_tags_id as id, s7b_tags_name as name FROM s7b_tags WHERE s7b_tags_id = ?',
      [tagId]
    );

    if (tagRows.length === 0) {
      await connection.end();
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Tag not found' })
      };
    }

    const tag = tagRows[0];

    // Get total count of articles for this tag
    const [countRows] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM s7b_article a
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      WHERE ti.s7b_tags_id = ? AND a.s7b_article_active = 1
    `, [tagId]);
    const totalItems = countRows[0].total;

    // Get articles for this tag with pagination
    const [articles] = await connection.query(`
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_add_date as createdAt,
        a.s7b_section_id as sectionId,
        s.s7b_section_title as sectionName,
        a.s7b_user_id as authorId,
        u.s7b_user_name as authorName,
        u.s7b_user_display_name as authorDisplayName,
        a.s7b_article_active as active
      FROM s7b_article a
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE ti.s7b_tags_id = ? AND a.s7b_article_active = 1
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?
    `, [tagId, pageSize, offset]);

    await connection.end();

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          tag: {
            id: tag.id,
            name: tag.name,
            totalItems: totalItems,
            totalArticles: totalItems,
            articlesCount: totalItems,
            articles: articles
          },
          pagination: {
            page: page,
            currentPage: page,
            totalPages: totalPages,
            pageSize: pageSize,
            offset: offset,
            totalItems: totalItems,
            hasMore: page < totalPages,
            itemsOnPage: articles.length,
            nextPage: page < totalPages ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null
          }
        }
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
