const db = require('./shared/db');

/**
 * Scheduled Article Publisher
 * Triggered by EventBridge every 5 minutes.
 * Finds articles with scheduled_at <= NOW() that are still inactive,
 * and publishes them by setting active = 1 and clearing scheduled_at.
 */
exports.handler = async (event) => {
  console.log('Scheduled publisher triggered:', JSON.stringify(event));

  try {
    // Find articles due for publishing
    const dueArticles = await db.query(
      `SELECT s7b_article_id, s7b_article_title, s7b_article_scheduled_at
       FROM s7b_article
       WHERE s7b_article_scheduled_at IS NOT NULL
         AND s7b_article_scheduled_at <= NOW()
         AND s7b_article_active = 0
         AND s7b_article_deleted_at IS NULL`
    );

    if (dueArticles.length === 0) {
      console.log('No articles due for publishing');
      return { published: 0 };
    }

    console.log(`Found ${dueArticles.length} article(s) to publish`);

    // Publish each article
    const publishedIds = [];
    for (const article of dueArticles) {
      await db.query(
        `UPDATE s7b_article
         SET s7b_article_active = 1,
             s7b_article_scheduled_at = NULL,
             s7b_article_updated_at = NOW()
         WHERE s7b_article_id = ?`,
        [article.s7b_article_id]
      );
      publishedIds.push(article.s7b_article_id);
      console.log(`Published article ${article.s7b_article_id}: ${article.s7b_article_title}`);
    }

    return {
      published: publishedIds.length,
      articleIds: publishedIds,
    };
  } catch (error) {
    console.error('Scheduler error:', error);
    throw error;
  }
};
