/**
 * Lambda Function: Get Top Writers
 * 
 * Returns top 3 writers based on total article views/readers
 * Follows S7abt Lambda structure with shared/db.js
 */

const { getConnection } = require('./shared/db');

/**
 * CORS headers for API Gateway
 */
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  let connection;

  try {
    // Get database connection from shared module
    console.log('Getting database connection...');
    connection = await getConnection();
    console.log('Database connection established');

    // SQL query to get top 3 writers
    // Note: Since there's no views column, ranking by article count instead
    const query = `
      SELECT 
        u.s7b_user_id as id,
        u.s7b_user_username as username,
        u.s7b_user_name as displayName,
        u.s7b_user_brief as bio,
        u.s7b_user_image as avatarUrl,
        u.s7b_user_twitter as twitter,
        u.s7b_user_linkedin as linkedin,
        u.s7b_user_facebook as facebook,
        COUNT(DISTINCT a.s7b_article_id) as articlesCount
      FROM s7b_user u
      LEFT JOIN s7b_article a ON u.s7b_user_id = a.s7b_user_id
      WHERE a.s7b_article_active = 1
        AND u.s7b_user_active = 1
      GROUP BY 
        u.s7b_user_id,
        u.s7b_user_username,
        u.s7b_user_name,
        u.s7b_user_brief,
        u.s7b_user_image,
        u.s7b_user_twitter,
        u.s7b_user_linkedin,
        u.s7b_user_facebook
      ORDER BY articlesCount DESC
      LIMIT 3
    `;

    console.log('Executing query...');
    const [rows] = await connection.execute(query);
    console.log(`Found ${rows.length} top writers`);

    // Format the response
    const writers = rows.map(writer => ({
      id: writer.id,
      username: writer.username,
      displayName: writer.displayName,
      bio: writer.bio || '',
      articlesCount: parseInt(writer.articlesCount) || 0,
      avatarUrl: writer.avatarUrl || null,
      socialMedia: {
        twitter: writer.twitter || null,
        linkedin: writer.linkedin || null,
        facebook: writer.facebook || null,
      }
    }));

    // Success response
    const response = {
      success: true,
      data: {
        writers,
        count: writers.length,
        timestamp: new Date().toISOString(),
      }
    };

    console.log('Success:', JSON.stringify(response, null, 2));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Error:', error);

    // Error response
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Failed to fetch top writers'
    };

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify(errorResponse),
    };

  } finally {
    // Close database connection
    if (connection) {
      try {
        await connection.end();
        console.log('Database connection closed');
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};
