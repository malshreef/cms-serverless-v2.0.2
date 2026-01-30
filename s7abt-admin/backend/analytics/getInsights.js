const { query, queryOne } = require('./shared/db');
const { success, error } = require('./shared/response');

/**
 * Get comprehensive analytics and insights for the admin dashboard
 * Replaces mock data with real database queries
 */
exports.handler = async (event) => {
  console.log('Get Insights Event:', JSON.stringify(event, null, 2));

  try {
    const params = event.queryStringParameters || {};
    const range = params.range || '90d'; // 7d, 30d, 90d, 12m
    const contentType = params.contentType || 'all'; // all, posts, news, tags

    // Calculate date range
    const dateFilter = getDateFilter(range);

    // Run all queries in parallel for performance
    const [
      cadenceData,
      tagDistribution,
      engagementMetrics,
      tweetQueue,
      staleDrafts,
      contentStats
    ] = await Promise.all([
      getContentCadence(dateFilter, contentType),
      getTagDistribution(contentType),
      getEngagementMetrics(dateFilter),
      getTweetQueueCount(),
      getStaleDrafts(),
      getContentStats(dateFilter, contentType)
    ]);

    return success({
      dateRange: range,
      contentType,
      stats: {
        publishRate: cadenceData.publishRate,
        totalViews: engagementMetrics.totalViews,
        totalPosts: contentStats.totalPosts,
        tweetQueueCount: tweetQueue.count
      },
      cadence: cadenceData.monthly,
      tags: tagDistribution,
      engagement: engagementMetrics.monthly,
      staleDrafts: staleDrafts,
      // Placeholder data for features not yet implemented
      latency: generateLatencyPlaceholder(),
      costs: generateCostPlaceholder(),
      qualityIssues: []
    });

  } catch (err) {
    console.error('Error fetching insights:', err);
    return error('Failed to fetch insights: ' + err.message, 500);
  }
};

/**
 * Get date filter based on range
 */
function getDateFilter(range) {
  const now = new Date();
  let startDate;

  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '12m':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    months: range === '12m' ? 12 : Math.ceil((now - startDate) / (30 * 24 * 60 * 60 * 1000))
  };
}

/**
 * Get content publishing cadence by month
 */
async function getContentCadence(dateFilter, contentType) {
  let table = 's7b_article';
  let dateColumn = 's7b_article_add_date';
  let activeColumn = 's7b_article_active';
  let deletedColumn = 's7b_article_deleted_at';

  if (contentType === 'news') {
    table = 's7b_news';
    dateColumn = 's7b_news_add_date';
    activeColumn = 's7b_news_active';
    deletedColumn = 's7b_news_deleted_at';
  }

  // Get monthly post count
  const sql = `
    SELECT
      DATE_FORMAT(${dateColumn}, '%Y-%m') as month,
      COUNT(*) as posts
    FROM ${table}
    WHERE ${dateColumn} >= ?
      AND ${dateColumn} <= ?
      AND ${activeColumn} = 1
      AND ${deletedColumn} IS NULL
    GROUP BY DATE_FORMAT(${dateColumn}, '%Y-%m')
    ORDER BY month ASC
  `;

  const results = await query(sql, [dateFilter.startDate, dateFilter.endDate]);

  // Format for frontend (short month names)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = results.map(row => ({
    month: monthNames[parseInt(row.month.split('-')[1]) - 1],
    posts: parseInt(row.posts)
  }));

  // Calculate publish rate (avg posts per month)
  const totalPosts = monthly.reduce((sum, m) => sum + m.posts, 0);
  const publishRate = monthly.length > 0 ? (totalPosts / monthly.length).toFixed(1) : '0';

  return {
    monthly,
    publishRate: parseFloat(publishRate)
  };
}

/**
 * Get tag distribution
 */
async function getTagDistribution(contentType) {
  if (contentType === 'news') {
    // News doesn't have tags in current schema
    return [];
  }

  try {
    // Use s7b_tags_item which is the actual junction table
    const sql = `
      SELECT
        t.s7b_tags_name as name,
        COUNT(DISTINCT ti.s7b_article_id) as value
      FROM s7b_tags t
      LEFT JOIN s7b_tags_item ti ON t.s7b_tags_id = ti.s7b_tags_id
      LEFT JOIN s7b_article a ON ti.s7b_article_id = a.s7b_article_id
      WHERE a.s7b_article_active = 1
        AND a.s7b_article_deleted_at IS NULL
      GROUP BY t.s7b_tags_id, t.s7b_tags_name
      ORDER BY value DESC
      LIMIT 10
    `;

    const results = await query(sql);
    return results.map(row => ({
      name: row.name,
      value: parseInt(row.value)
    }));
  } catch (error) {
    console.error('Error fetching tag distribution:', error.message);
    // Return empty array if table doesn't exist
    return [];
  }
}

/**
 * Get engagement metrics (views over time)
 */
async function getEngagementMetrics(dateFilter) {
  // Note: views tracking might not be fully implemented yet
  // This queries the s7b_article_views field
  const sql = `
    SELECT
      DATE_FORMAT(s7b_article_add_date, '%Y-%m') as month,
      SUM(COALESCE(s7b_article_views, 0)) as views
    FROM s7b_article
    WHERE s7b_article_add_date >= ?
      AND s7b_article_add_date <= ?
      AND s7b_article_active = 1
      AND s7b_article_deleted_at IS NULL
    GROUP BY DATE_FORMAT(s7b_article_add_date, '%Y-%m')
    ORDER BY month ASC
  `;

  const results = await query(sql, [dateFilter.startDate, dateFilter.endDate]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = results.map(row => ({
    month: monthNames[parseInt(row.month.split('-')[1]) - 1],
    views: parseInt(row.views) || 0,
    reads: Math.round(parseInt(row.views) * 0.67) || 0, // Estimate: 67% read rate
    subs: Math.round(parseInt(row.views) * 0.08) || 0    // Estimate: 8% subscription rate
  }));

  const totalViews = monthly.reduce((sum, m) => sum + m.views, 0);

  return {
    monthly,
    totalViews
  };
}

/**
 * Get tweet queue count
 */
async function getTweetQueueCount() {
  try {
    const sql = `
      SELECT COUNT(*) as count
      FROM s7b_tweets
      WHERE s7b_tweet_status = 'pending'
        AND s7b_tweet_deleted_at IS NULL
    `;

    const result = await queryOne(sql);
    return {
      count: parseInt(result?.count || 0)
    };
  } catch (error) {
    console.error('Error fetching tweet queue count:', error.message);
    // Return 0 if tweets table doesn't exist yet
    return { count: 0 };
  }
}

/**
 * Get stale drafts (unpublished articles older than 7 days)
 */
async function getStaleDrafts() {
  const sql = `
    SELECT
      s7b_article_id as id,
      s7b_article_title as title,
      DATEDIFF(NOW(), s7b_article_add_date) as age,
      u.s7b_user_name as owner
    FROM s7b_article a
    LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
    WHERE s7b_article_active = 0
      AND s7b_article_deleted_at IS NULL
      AND DATEDIFF(NOW(), s7b_article_add_date) > 7
    ORDER BY age DESC
    LIMIT 10
  `;

  const results = await query(sql);
  return results.map(row => ({
    id: row.id,
    title: row.title,
    age: row.age,
    owner: row.owner || 'Unknown'
  }));
}

/**
 * Get overall content stats
 */
async function getContentStats(dateFilter, contentType) {
  let table = 's7b_article';
  let dateColumn = 's7b_article_add_date';
  let activeColumn = 's7b_article_active';
  let deletedColumn = 's7b_article_deleted_at';

  if (contentType === 'news') {
    table = 's7b_news';
    dateColumn = 's7b_news_add_date';
    activeColumn = 's7b_news_active';
    deletedColumn = 's7b_news_deleted_at';
  }

  const sql = `
    SELECT COUNT(*) as total
    FROM ${table}
    WHERE ${dateColumn} >= ?
      AND ${dateColumn} <= ?
      AND ${activeColumn} = 1
      AND ${deletedColumn} IS NULL
  `;

  const result = await queryOne(sql, [dateFilter.startDate, dateFilter.endDate]);
  return {
    totalPosts: parseInt(result?.total || 0)
  };
}

/**
 * Generate placeholder latency data (until CloudWatch integration is added)
 */
function generateLatencyPlaceholder() {
  return Array.from({ length: 14 }).map((_, i) => ({
    day: `D${i + 1}`,
    p95: Math.round(180 + Math.sin(i) * 30) // Simulated p95 latency ~180-210ms
  }));
}

/**
 * Generate placeholder cost data (until Cost Explorer integration is added)
 */
function generateCostPlaceholder() {
  return [
    { name: 'Lambda', value: 18 },
    { name: 'API GW', value: 12 },
    { name: 'S3+CF', value: 9 },
    { name: 'RDS', value: 28 },
    { name: 'OpenSearch', value: 15 },
    { name: 'Misc', value: 6 }
  ];
}
