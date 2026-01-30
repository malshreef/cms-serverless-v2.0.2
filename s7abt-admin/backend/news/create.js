const db = require('./shared/db');
const { success, error } = require('./shared/response');
const { checkAuthorization, filterStatusChange, getUserDbId } = require('./shared/authorize');
const { getUserEmail } = require('./shared/permissions');

/**
 * Create new news item
 */
exports.handler = async (event) => {
  console.log('Create news request:', JSON.stringify(event, null, 2));

  try {
    // Check authorization
    const authError = checkAuthorization(event, 'news', 'create');
    if (authError) return authError;

    const body = JSON.parse(event.body || '{}');
    const {
      title,
      brief,
      body: newsBody,
      image,
      logo = 'flaticon-edit',
      active = 0,
      showWidth = 12
    } = body;

    // Get current user's database ID from their email
    const userEmail = getUserEmail(event);
    console.log('News create - User email from Cognito:', userEmail);
    console.log('News create - Cognito claims:', JSON.stringify(event.requestContext?.authorizer?.claims, null, 2));

    const userId = await getUserDbId(userEmail);
    console.log('News create - Resolved userId:', userId);

    if (!userId) {
      console.error('News create - Failed to resolve userId for email:', userEmail);
      return error(`Unable to identify current user. Email: ${userEmail}`, 400);
    }

    // Validation
    if (!title || !newsBody) {
      return error('Title and body are required', 400);
    }

    // Filter active status based on publish permission (content_specialist can only create inactive)
    const allowedActive = filterStatusChange(event, 'news', active === 1 ? 'published' : 'draft') === 'published' ? 1 : 0;

    // Validate title length
    if (title.length > 100) {
      return error('Title must be 100 characters or less', 400);
    }

    // Validate body length
    if (newsBody.length > 2000) {
      return error('Body must be 2000 characters or less', 400);
    }

    // Validate brief length
    if (brief && brief.length > 200) {
      return error('Brief must be 200 characters or less', 400);
    }

    const query = `
      INSERT INTO s7b_news (
        s7b_news_title,
        s7b_news_brief,
        s7b_news_body,
        s7b_news_image,
        s7b_news_logo,
        s7b_news_active,
        s7b_news_show_width,
        s7b_user_id,
        s7b_news_add_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      title,
      brief || 'لايوجد مختصر لهذا الخبر',
      newsBody,
      image || null,
      logo,
      allowedActive,
      showWidth,
      userId
    ];

    const result = await db.query(query, params);

    // Fetch the created news item
    const createdNews = await db.queryOne(
      'SELECT * FROM s7b_news WHERE s7b_news_id = ?',
      [result.insertId]
    );

    return success({
      message: 'News created successfully',
      news: {
        id: result.insertId,
        title,
        brief: brief || 'لايوجد مختصر لهذا الخبر',
        body: newsBody,
        image,
        logo,
        active,
        showWidth,
        userId,
        addDate: createdNews.s7b_news_add_date
      }
    }, 201);

  } catch (err) {
    console.error('Error creating news:', err);
    return error('Failed to create news', 500);
  }
};

