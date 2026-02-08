const db = require('../shared/db');
const { success, error, badRequest } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const params = event.queryStringParameters || {};
    const tagsParam = params.tags;
    const limit = parseInt(params.limit) || 20;
    const offset = parseInt(params.offset) || 0;

    if (!tagsParam) {
      return badRequest('tags parameter is required');
    }

    // Split comma-separated tags and trim
    const tagNames = tagsParam.split(',').map(t => t.trim()).filter(Boolean);

    if (tagNames.length === 0) {
      return badRequest('At least one tag is required');
    }

    // Build placeholders for IN clause
    const placeholders = tagNames.map(() => '?').join(',');

    // Match tags by slug or name (case-insensitive)
    const tagMatchParams = [...tagNames, ...tagNames];

    // Get articles that have any of the specified tags
    const query = `
      SELECT DISTINCT
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_premium as premium,
        a.s7b_section_id as sectionId,
        a.s7b_user_id as userId,
        a.s7b_article_add_date as createdAt,
        s.s7b_section_title as sectionTitle,
        s.s7b_section_id as sectionId2,
        u.s7b_user_name as author
      FROM s7b_article a
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      INNER JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
      WHERE a.s7b_article_active = 1
        AND a.s7b_article_deleted_at IS NULL
        AND (t.s7b_tags_slug IN (${placeholders}) OR t.s7b_tags_name IN (${placeholders}))
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...tagMatchParams, limit, offset];
    const articles = await db.rawQuery(query, queryParams);

    // Get tags for each article
    const articleIds = articles.map(a => a.id);
    let articleTags = {};

    if (articleIds.length > 0) {
      const tagPlaceholders = articleIds.map(() => '?').join(',');
      const tagsQuery = `
        SELECT ti.s7b_article_id as articleId, t.s7b_tags_id as id, t.s7b_tags_name as name
        FROM s7b_tags_item ti
        INNER JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
        WHERE ti.s7b_article_id IN (${tagPlaceholders})
      `;
      const tagsResult = await db.rawQuery(tagsQuery, articleIds);

      for (const row of tagsResult) {
        if (!articleTags[row.articleId]) articleTags[row.articleId] = [];
        articleTags[row.articleId].push({ id: row.id, name: row.name });
      }
    }

    // Format articles
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      image: article.image,
      premium: article.premium === 1,
      sectionId: article.sectionId,
      userId: article.userId,
      createdAt: article.createdAt,
      author: article.author,
      section: article.sectionId ? {
        id: article.sectionId,
        title: article.sectionTitle
      } : null,
      tags: articleTags[article.id] || []
    }));

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT a.s7b_article_id) as total
      FROM s7b_article a
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      INNER JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
      WHERE a.s7b_article_active = 1
        AND a.s7b_article_deleted_at IS NULL
        AND (t.s7b_tags_slug IN (${placeholders}) OR t.s7b_tags_name IN (${placeholders}))
    `;
    const countResult = await db.rawQuery(countQuery, tagMatchParams);
    const total = countResult[0].total;

    return success({
      articles: formattedArticles,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });

  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch articles by tags', 500, err.message);
  }
};
