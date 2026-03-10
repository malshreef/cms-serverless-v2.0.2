const db = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  try {
    // Get tag names from query parameters (comma-separated)
    const tagsParam = event.queryStringParameters?.tags;

    if (!tagsParam) {
      return error('tags query parameter is required (comma-separated tag names)', 400);
    }

    const tagNames = tagsParam.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (tagNames.length === 0) {
      return error('At least one tag name is required', 400);
    }

    // Get pagination parameters
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const offset = parseInt(event.queryStringParameters?.offset) || 0;

    // Build placeholders for IN clause
    const placeholders = tagNames.map(() => '?').join(',');

    // Get total count of articles matching these tags
    const countResult = await db.rawQuery(
      `SELECT COUNT(DISTINCT a.s7b_article_id) as total
       FROM s7b_article a
       INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
       INNER JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
       WHERE t.s7b_tags_name IN (${placeholders})
         AND a.s7b_article_active = 1
         AND a.s7b_article_deleted_at IS NULL`,
      tagNames
    );
    const total = countResult[0].total;

    // Get articles matching these tag names
    const articles = await db.rawQuery(
      `SELECT DISTINCT
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_add_date as createdAt,
        a.s7b_article_premium as premium,
        a.s7b_section_id as sectionId,
        s.s7b_section_title as sectionTitle,
        u.s7b_user_id as userId,
        u.s7b_user_name as userName
      FROM s7b_article a
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      INNER JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE t.s7b_tags_name IN (${placeholders})
        AND a.s7b_article_active = 1
        AND a.s7b_article_deleted_at IS NULL
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?`,
      [...tagNames, limit, offset]
    );

    // Get tags for each article
    const articleIds = articles.map(a => a.id);
    let articleTags = {};

    if (articleIds.length > 0) {
      const tagPlaceholders = articleIds.map(() => '?').join(',');
      const tagsResult = await db.rawQuery(
        `SELECT ti.s7b_article_id as articleId, t.s7b_tags_id as id, t.s7b_tags_name as name
         FROM s7b_tags_item ti
         INNER JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
         WHERE ti.s7b_article_id IN (${tagPlaceholders})`,
        articleIds
      );

      tagsResult.forEach(row => {
        if (!articleTags[row.articleId]) {
          articleTags[row.articleId] = [];
        }
        articleTags[row.articleId].push({ id: row.id, name: row.name });
      });
    }

    // Format articles with section and tags info
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      image: article.image,
      createdAt: article.createdAt,
      premium: article.premium,
      userId: article.userId,
      userName: article.userName,
      sectionId: article.sectionId,
      sectionTitle: article.sectionTitle,
      section: {
        id: article.sectionId,
        title: article.sectionTitle
      },
      tags: articleTags[article.id] || []
    }));

    return success({
      articles: formattedArticles,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    });

  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch articles by tags', 500, err.message);
  }
};
