const { getConnection } = require('./shared/db');
const { success, error } = require('./shared/response');

exports.handler = async (event) => {
  // ✅ EXTENSIVE LOGGING FOR DEBUGGING
  console.log('='.repeat(80));
  console.log('🔍 FULL EVENT OBJECT:', JSON.stringify(event, null, 2));
  console.log('='.repeat(80));
  
  let connection;
  
  try {
    // Get path parameters
    const tagId = event.pathParameters?.id;
    
    console.log('📌 Tag ID:', tagId);
    
    if (!tagId) {
      return error('Tag ID is required', 400);
    }
    
    // ✅ LOG QUERY PARAMETERS BEFORE PARSING
    console.log('📊 Raw queryStringParameters:', event.queryStringParameters);
    console.log('📊 Type of queryStringParameters:', typeof event.queryStringParameters);
    
    // ✅ Get pagination parameters with detailed logging
    const rawPage = event.queryStringParameters?.page;
    const rawPageSize = event.queryStringParameters?.pageSize;
    const rawStatus = event.queryStringParameters?.status;
    
    console.log('📊 Raw page parameter:', rawPage, typeof rawPage);
    console.log('📊 Raw pageSize parameter:', rawPageSize, typeof rawPageSize);
    console.log('📊 Raw status parameter:', rawStatus, typeof rawStatus);
    
    const page = parseInt(rawPage || '1');
    const pageSize = parseInt(rawPageSize || '15');
    const status = rawStatus || 'published';
    
    console.log('✅ Parsed page:', page);
    console.log('✅ Parsed pageSize:', pageSize);
    console.log('✅ Parsed status:', status);
    console.log('✅ Calculated offset:', (page - 1) * pageSize);
    
    // Validate parameters
    const validStatuses = ['published', 'draft', 'all'];
    if (!validStatuses.includes(status)) {
      return error('Invalid status parameter. Must be one of: published, draft, all', 400);
    }
    
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return error('Invalid pagination parameters. Page must be >= 1, pageSize must be 1-100', 400);
    }
    
    const offset = (page - 1) * pageSize;
    
    // Build WHERE clause for article status filter
    let articleWhereClause = '';
    if (status === 'published') {
      articleWhereClause = 'AND a.s7b_article_active = 1';
    } else if (status === 'draft') {
      articleWhereClause = 'AND a.s7b_article_active = 0';
    }
    
    console.log('🔍 WHERE clause:', articleWhereClause);
    
    // Get database connection
    connection = await getConnection();
    console.log('✅ Database connected');
    
    // ============================================================================
    // STEP 1: Get tag basic info
    // ============================================================================
    const [tagRows] = await connection.execute(
      'SELECT s7b_tags_id as id, s7b_tags_name as name FROM s7b_tags WHERE s7b_tags_id = ?',
      [tagId]
    );
    
    if (tagRows.length === 0) {
      console.log('❌ Tag not found');
      return error('Tag not found', 404);
    }
    
    const tagInfo = tagRows[0];
    console.log('✅ Tag found:', tagInfo.name);
    
    // ============================================================================
    // STEP 2: Get TOTAL count
    // ============================================================================
    console.log('🔍 Executing COUNT query...');
    const countQuery = `
      SELECT COUNT(DISTINCT a.s7b_article_id) as totalCount
      FROM s7b_article a
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      WHERE ti.s7b_tags_id = ?
        ${articleWhereClause}
    `;
    console.log('🔍 COUNT Query:', countQuery);
    
    const [countResult] = await connection.execute(countQuery, [tagId]);
    
    const totalArticles = countResult[0]?.totalCount || 0;
    const totalPages = Math.ceil(totalArticles / pageSize);
    
    console.log('📊 TOTAL ARTICLES FOUND:', totalArticles);
    console.log('📊 Total pages:', totalPages);
    console.log('📊 Current page:', page);
    
    // ============================================================================
    // STEP 3: Get paginated articles
    // ============================================================================
    console.log('🔍 Executing ARTICLES query...');
    console.log('🔍 LIMIT:', pageSize, 'OFFSET:', offset);
    
    const articlesQuery = `
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_add_date as createdAt,
        a.s7b_article_active as active,
        s.s7b_section_title as sectionName,
        s.s7b_section_id as sectionId,
        u.s7b_user_username as authorName,
        u.s7b_user_id as authorId
      FROM s7b_article a
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE ti.s7b_tags_id = ?
        ${articleWhereClause}
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?
    `;
    console.log('🔍 ARTICLES Query:', articlesQuery);
    
    const [articles] = await connection.execute(articlesQuery, [tagId, pageSize, offset]);
    
    console.log('📊 ARTICLES RETURNED:', articles.length);
    console.log('📊 First article ID:', articles[0]?.id);
    console.log('📊 Last article ID:', articles[articles.length - 1]?.id);
    
    // ============================================================================
    // STEP 4: Build response
    // ============================================================================
    const tagResponse = {
      id: tagInfo.id,
      name: tagInfo.name,
      totalItems: totalArticles,
      totalArticles: totalArticles,
      articlesCount: totalArticles,
      articles: articles
    };
    
    const paginationInfo = {
      page: page,
      currentPage: page,
      totalPages: totalPages,
      pageSize: pageSize,
      offset: offset,
      totalItems: totalArticles,
      hasMore: page < totalPages,
      itemsOnPage: articles.length,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    };
    
    console.log('✅ Response built successfully');
    console.log('📊 Pagination info:', JSON.stringify(paginationInfo));
    console.log('='.repeat(80));
    
    return success({
      tag: tagResponse,
      pagination: paginationInfo,
      filter: {
        status,
        description: status === 'published' ? 'Published articles only' : 
                    status === 'draft' ? 'Draft articles only' : 
                    'All articles'
      }
    });
    
  } catch (err) {
    console.error('❌ ERROR:', err);
    console.error('❌ Error stack:', err.stack);
    return error('Failed to fetch tag details', 500, err.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
};