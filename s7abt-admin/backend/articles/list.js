const db = require('./shared/db');
const response = require('./shared/response');

/**
 * List all articles with pagination and filtering
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('List articles event:', JSON.stringify(event));

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const offset = (page - 1) * limit;
    const status = params.status; // 'draft' or 'published'
    const sectionId = params.sectionId || params.section_id;
    const search = params.search;
    const premium = params.premium; // 'true' for premium articles only

    // Build WHERE clause
    let whereConditions = ['a.s7b_article_deleted_at IS NULL'];
    let queryParams = [];

    if (status) {
      // Map status to active field: 'published' = 1, 'draft' = 0
      const activeValue = status === 'published' ? 1 : 0;
      whereConditions.push('a.s7b_article_active = ?');
      queryParams.push(activeValue);
    }

    if (sectionId) {
      whereConditions.push('a.s7b_section_id = ?');
      queryParams.push(sectionId);
    }

    if (search) {
      whereConditions.push('(a.s7b_article_title LIKE ? OR a.s7b_article_description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (premium === 'true') {
      whereConditions.push('a.s7b_article_premium = 1');
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM s7b_article a
      WHERE ${whereClause}
    `;
    const countResult = await db.queryOne(countSql, queryParams);
    const total = countResult.total;

    // Get articles with related data
    const sql = `
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_slug as slug,
        a.s7b_article_description as excerpt,
        a.s7b_article_image as main_image,
        a.s7b_article_active as active,
        a.s7b_article_premium as premium,
        a.s7b_article_views as views,
        a.s7b_article_add_date as created_at,
        a.s7b_article_updated_at as updated_at,
        u.s7b_user_name as author_name,
        u.s7b_user_id as author_id,
        s.s7b_section_title as section_name,
        s.s7b_section_id as section_id,
        GROUP_CONCAT(DISTINCT t.s7b_tags_name SEPARATOR ', ') as tags,
        GROUP_CONCAT(DISTINCT t.s7b_tags_id SEPARATOR ',') as tag_ids
      FROM s7b_article a
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      LEFT JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
      WHERE ${whereClause}
      GROUP BY a.s7b_article_id, a.s7b_article_title, a.s7b_article_slug, 
               a.s7b_article_description, a.s7b_article_image,
               a.s7b_article_active, a.s7b_article_premium, a.s7b_article_views, 
               a.s7b_article_add_date, a.s7b_article_updated_at,
               u.s7b_user_name, u.s7b_user_id, 
               s.s7b_section_title, s.s7b_section_id
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const articles = await db.rawQuery(sql, queryParams);

    // Format the response
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      mainImage: article.main_image,
      status: article.active === 1 ? 'published' : 'draft',
      premium: article.premium === 1,
      views: article.views || 0,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      author: {
        id: article.author_id,
        name: article.author_name
      },
      section: article.section_id ? {
        id: article.section_id,
        name: article.section_name
      } : null,
      tags: article.tags ? article.tags.split(', ').map((name, index) => ({
        id: parseInt(article.tag_ids.split(',')[index]),
        name
      })) : []
    }));

    return response.success({
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error listing articles:', error);
    return response.error('Failed to list articles', 500, error.message);
  }
};

