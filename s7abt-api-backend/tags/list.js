const db = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  try {
    // Get all tags with usage count
    const tags = await db.query(
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
      LEFT JOIN s7b_article a ON ti.s7b_article_id = a.s7b_article_id AND a.s7b_article_active = 1 AND a.s7b_article_deleted_at IS NULL
      GROUP BY t.s7b_tags_id, t.s7b_tags_name
      ORDER BY totalUsage DESC, t.s7b_tags_name ASC
      `
    );

    return success({ tags });

  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch tags', 500, err.message);
  }
};
