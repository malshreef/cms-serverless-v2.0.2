const db = require('../shared/db');
const { success, error } = require('../shared/response');

/**
 * Track article share by platform
 * POST /articles/{id}/share
 * Body: { platform: 'twitter' | 'linkedin' | 'whatsapp' | 'copy' }
 */
exports.handler = async (event) => {
  console.log('Share Event:', JSON.stringify(event, null, 2));

  try {
    const articleId = event.pathParameters?.id;

    if (!articleId) {
      return error('Article ID is required', 400);
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return error('Invalid JSON body', 400);
    }

    const { platform } = body;

    // Validate platform
    const validPlatforms = ['twitter', 'linkedin', 'whatsapp', 'copy'];
    if (!platform || !validPlatforms.includes(platform)) {
      return error(`Invalid platform. Must be one of: ${validPlatforms.join(', ')}`, 400);
    }

    // Verify article exists
    const articles = await db.query(
      'SELECT s7b_article_id FROM s7b_article WHERE s7b_article_id = ? AND s7b_article_active = 1 AND s7b_article_deleted_at IS NULL',
      [articleId]
    );

    if (articles.length === 0) {
      return error('Article not found', 404);
    }

    // Insert share record
    const insertQuery = `
      INSERT INTO s7b_article_shares
        (s7b_article_id, s7b_share_platform)
      VALUES (?, ?)
    `;

    await db.rawQuery(insertQuery, [articleId, platform]);

    // Get updated share counts for this article
    const statsQuery = `
      SELECT
        s7b_share_platform as platform,
        COUNT(*) as count
      FROM s7b_article_shares
      WHERE s7b_article_id = ?
      GROUP BY s7b_share_platform
    `;

    const stats = await db.query(statsQuery, [articleId]);

    // Format stats
    const shareStats = {
      twitter: 0,
      linkedin: 0,
      whatsapp: 0,
      copy: 0,
      total: 0
    };

    stats.forEach(row => {
      shareStats[row.platform] = parseInt(row.count);
      shareStats.total += parseInt(row.count);
    });

    return success({
      message: 'Share recorded successfully',
      articleId: parseInt(articleId),
      platform,
      stats: shareStats
    });

  } catch (err) {
    console.error('Error recording share:', err);
    return error('Failed to record share', 500, err.message);
  }
};
