const db = require('../shared/db');
const { success, error } = require('../shared/response');

// Calculate reading time from article content
function calculateReadingTime(div1Body, div2Body, div3Body, div4Body, div5Body) {
  // Combine all div bodies
  const fullText = [div1Body, div2Body, div3Body, div4Body, div5Body]
    .filter(text => text && text.length > 0)
    .join(' ');

  if (!fullText) return 5; // Default 5 minutes if no content

  // Remove HTML tags
  const plainText = fullText.replace(/<[^>]*>/g, '');

  // Count Arabic and English words separately
  const arabicWords = (plainText.match(/[\u0600-\u06FF]+/g) || []).length;
  const englishWords = (plainText.match(/[a-zA-Z]+/g) || []).length;

  // Calculate reading time (Arabic: 180 WPM, English: 250 WPM)
  const arabicTime = arabicWords / 180;
  const englishTime = englishWords / 250;

  const totalMinutes = Math.ceil(arabicTime + englishTime);

  // Return at least 1 minute, max 60 minutes
  return Math.max(1, Math.min(60, totalMinutes));
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const connection = await db.getConnection();
    
    // Get query parameters
    const limit = parseInt(event.queryStringParameters?.limit) || 12;
    const offset = parseInt(event.queryStringParameters?.offset) || 0;
    const sectionId = event.queryStringParameters?.section;
    const premium = event.queryStringParameters?.premium === 'true';
    const tagId = event.queryStringParameters?.tag;
    const search = event.queryStringParameters?.search;
    
    // Build query with correct table and column names
    // Include div bodies for reading time calculation
    let query = `
      SELECT
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_premium as premium,
        a.s7b_section_id as sectionId,
        a.s7b_user_id as userId,
        a.s7b_article_add_date as createdAt,
        a.s7b_article_active as active,
        a.s7b_article_div1_body as div1Body,
        a.s7b_article_div2_body as div2Body,
        a.s7b_article_div3_body as div3Body,
        a.s7b_article_div4_body as div4Body,
        a.s7b_article_div5_body as div5Body,
        s.s7b_section_title as sectionName,
        u.s7b_user_name as authorName,
        u.s7b_user_image as authorImage
      FROM s7b_article a
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE a.s7b_article_active = 1
    `;
    
    const params = [];
    
    // Filter by premium if provided
    if (premium) {
      query += ' AND a.s7b_article_premium = ?';
      params.push(1);
    }
    
    // Filter by section if provided
    if (sectionId) {
      query += ' AND a.s7b_section_id = ?';
      params.push(sectionId);
    }
    
    // Filter by tag if provided
    if (tagId) {
      query += ' AND EXISTS (SELECT 1 FROM s7b_tags_item ti WHERE ti.s7b_article_id = a.s7b_article_id AND ti.s7b_tags_id = ?)';
      params.push(tagId);
    }
    
    // Filter by search if provided
    if (search) {
      query += ' AND (a.s7b_article_title LIKE ? OR a.s7b_article_description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Order and pagination
    query += ' ORDER BY a.s7b_article_add_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // Execute query
    const [articles] = await connection.execute(query, params);

    // Calculate reading time for each article and remove div bodies from response
    const processedArticles = articles.map(article => {
      const readingTime = calculateReadingTime(
        article.div1Body,
        article.div2Body,
        article.div3Body,
        article.div4Body,
        article.div5Body
      );

      // Remove div bodies from the response to reduce payload size
      const { div1Body, div2Body, div3Body, div4Body, div5Body, ...articleWithoutDivs } = article;

      return {
        ...articleWithoutDivs,
        readingTime
      };
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM s7b_article a WHERE a.s7b_article_active = 1';
    const countParams = [];
    
    if (premium) {
      countQuery += ' AND a.s7b_article_premium = ?';
      countParams.push(1);
    }
    
    if (sectionId) {
      countQuery += ' AND a.s7b_section_id = ?';
      countParams.push(sectionId);
    }
    
    if (tagId) {
      countQuery += ' AND EXISTS (SELECT 1 FROM s7b_tags_item ti WHERE ti.s7b_article_id = a.s7b_article_id AND ti.s7b_tags_id = ?)';
      countParams.push(tagId);
    }
    
    if (search) {
      countQuery += ' AND (a.s7b_article_title LIKE ? OR a.s7b_article_description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    await connection.end();

    return success({
      articles: processedArticles,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch articles', err.message);
  }
};
