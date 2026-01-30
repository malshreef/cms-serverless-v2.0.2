const db = require('./shared/db');
const response = require('./shared/response');

exports.handler = async (event) => {
  try {
    console.log('Fetching dashboard stats...');
    
    // Get total articles count
    const articlesCount = await db.queryOne(`
      SELECT COUNT(*) as count 
      FROM s7b_article 
      WHERE s7b_article_deleted_at IS NULL
    `);
    
    // Get total news count
    const newsCount = await db.queryOne(`
      SELECT COUNT(*) as count 
      FROM s7b_news 
      WHERE s7b_news_deleted_at IS NULL
    `);
    
    // Get total users count (exclude deleted users)
    const usersCount = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM s7b_user
      WHERE s7b_user_deleted_at IS NULL
    `);
    
    // Get recent articles with section names and correct status
    const recentArticles = await db.query(`
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_active as active,
        a.s7b_article_add_date as createdAt,
        s.s7b_section_title as sectionName
      FROM s7b_article a
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      WHERE a.s7b_article_deleted_at IS NULL
      ORDER BY a.s7b_article_add_date DESC
      LIMIT 5
    `);
    
    // Calculate growth percentages (mock data for now - can be enhanced later)
    const articleGrowth = 12;
    const newsGrowth = 8;
    const userGrowth = 3;
    
    // Tweets in queue (mock data - will be real when tweet system is implemented)
    const tweetsInQueue = 42;
    
    // Map articles to include proper status
    const mappedArticles = recentArticles.map(article => ({
      id: article.id,
      title: article.title,
      // Map active field to status: 1 = published, 0 = draft
      status: article.active === 1 ? 'published' : 'draft',
      createdAt: article.createdAt,
      sectionName: article.sectionName
    }));
    
    const stats = {
      totalArticles: articlesCount.count,
      totalNews: newsCount.count,
      totalUsers: usersCount.count,
      tweetsInQueue: tweetsInQueue,
      articleGrowth: articleGrowth,
      newsGrowth: newsGrowth,
      userGrowth: userGrowth,
      recentArticles: mappedArticles
    };
    
    console.log('Dashboard stats fetched successfully:', stats);
    
    return response.success(stats);
    
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return response.error(err.message || 'Failed to fetch dashboard stats', 500);
  }
};

