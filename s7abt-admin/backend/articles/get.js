const db = require('./shared/db');
const response = require('./shared/response');

/**
 * Get a single article by ID
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  try {
    console.log('Get article event:', JSON.stringify(event));

    const articleId = event.pathParameters?.id;

    if (!articleId) {
      return response.validationError([{ field: 'id', message: 'Article ID is required' }]);
    }

    // Get article with related data
    const sql = `
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_slug as slug,
        a.s7b_article_description as excerpt,
        a.s7b_article_div1 as div1_title,
        a.s7b_article_div1_body as div1_body,
        a.s7b_article_div2 as div2_title,
        a.s7b_article_div2_body as div2_body,
        a.s7b_article_div3 as div3_title,
        a.s7b_article_div3_body as div3_body,
        a.s7b_article_div4 as div4_title,
        a.s7b_article_div4_body as div4_body,
        a.s7b_article_div5 as div5_title,
        a.s7b_article_div5_body as div5_body,
        a.s7b_article_image as main_image,
        a.s7b_article_active as active,
        a.s7b_article_premium as premium,
        a.s7b_article_views as views,
        a.s7b_article_add_date as created_at,
        a.s7b_article_updated_at as updated_at,
        a.s7b_user_id as user_id,
        a.s7b_section_id as section_id,
        u.s7b_user_name as author_name,
        s.s7b_section_title as section_name
      FROM s7b_article a
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      WHERE a.s7b_article_id = ? AND a.s7b_article_deleted_at IS NULL
    `;

    const article = await db.queryOne(sql, [articleId]);

    if (!article) {
      return response.notFound('Article');
    }

    // Get article tags
    const tagsSql = `
      SELECT t.s7b_tags_id as id, t.s7b_tags_name as name, t.s7b_tags_slug as slug
      FROM s7b_tags t
      INNER JOIN s7b_tags_item ti ON t.s7b_tags_id = ti.s7b_tags_id
      WHERE ti.s7b_article_id = ?
    `;
    const tags = await db.query(tagsSql, [articleId]);

    // Combine all div sections into content
    const sections = [];
    for (let i = 1; i <= 5; i++) {
      const titleKey = `div${i}_title`;
      const bodyKey = `div${i}_body`;
      if (article[titleKey] || article[bodyKey]) {
        sections.push({
          title: article[titleKey] || '',
          content: article[bodyKey] || ''
        });
      }
    }

    // Format the response
    const formattedArticle = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      sections: sections, // Multi-section structure
      mainImage: article.main_image,
      status: article.active === 1 ? 'published' : 'draft',
      premium: article.premium === 1,
      views: article.views || 0,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      author: {
        id: article.user_id,
        name: article.author_name
      },
      section: article.section_id ? {
        id: article.section_id,
        name: article.section_name
      } : null,
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      }))
    };

    return response.success(formattedArticle);

  } catch (error) {
    console.error('Error getting article:', error);
    return response.error('Failed to get article', 500, error.message);
  }
};

