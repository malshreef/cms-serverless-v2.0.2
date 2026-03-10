const db = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  try {
    // Get tag ID from query parameters
    const tagId = event.queryStringParameters?.tagId;

    if (!tagId) {
      return error('tagId query parameter is required', 400);
    }

    // Get pagination parameters
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const pageSize = parseInt(event.queryStringParameters?.pageSize) || 15;
    const offset = (page - 1) * pageSize;

    // Get tag details
    const tagResult = await db.query(
      `SELECT s7b_tags_id as id, s7b_tags_name as name FROM s7b_tags WHERE s7b_tags_id = ?`,
      [tagId]
    );

    if (tagResult.length === 0) {
      return error('Tag not found', 404);
    }

    const tag = tagResult[0];

    // Get total articles count for this tag
    const countResult = await db.query(
      `SELECT COUNT(*) as total
       FROM s7b_article a
       INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
       WHERE ti.s7b_tags_id = ? AND a.s7b_article_active = 1 AND a.s7b_article_deleted_at IS NULL`,
      [tagId]
    );
    const totalArticles = countResult[0].total;

    // Get articles for this tag with pagination
    const articles = await db.rawQuery(
      `SELECT
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_add_date as createdAt,
        a.s7b_article_active as active,
        a.s7b_section_id as sectionId,
        s.s7b_section_title as sectionName,
        u.s7b_user_id as authorId,
        u.s7b_user_name as authorName,
        u.s7b_user_name as authorDisplayName
      FROM s7b_article a
      INNER JOIN s7b_tags_item ti ON a.s7b_article_id = ti.s7b_article_id
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE ti.s7b_tags_id = ? AND a.s7b_article_active = 1 AND a.s7b_article_deleted_at IS NULL
      ORDER BY a.s7b_article_add_date DESC
      LIMIT ? OFFSET ?`,
      [tagId, pageSize, offset]
    );

    const totalPages = Math.ceil(totalArticles / pageSize);

    tag.totalItems = totalArticles;
    tag.totalArticles = totalArticles;
    tag.articlesCount = totalArticles;
    tag.articles = articles;

    return success({
      tag,
      pagination: {
        page,
        currentPage: page,
        totalPages,
        pageSize,
        offset,
        totalItems: totalArticles,
        hasMore: page < totalPages,
        itemsOnPage: articles.length,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null
      }
    });

  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch articles by tag ID', 500, err.message);
  }
};
