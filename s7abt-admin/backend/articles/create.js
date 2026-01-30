const db = require('./shared/db');
const response = require('./shared/response');
const validation = require('./shared/validation');
const { checkAuthorization, filterStatusChange, getUserDbId } = require('./shared/authorize');
const { getUserEmail } = require('./shared/permissions');

/**
 * Create a new article
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  let connection;

  try {
    console.log('Create article event:', JSON.stringify(event));

    // Check authorization
    const authError = checkAuthorization(event, 'articles', 'create');
    if (authError) return authError;

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      title,
      slug,
      excerpt,
      sections, // Array of {title, content} objects
      mainImage,
      status = 'draft',
      premium = false,
      sectionId,
      tagIds = []
    } = body;

    // Get current user's database ID from their email
    const userEmail = getUserEmail(event);
    console.log('Article create - User email from Cognito:', userEmail);
    console.log('Article create - Cognito claims:', JSON.stringify(event.requestContext?.authorizer?.claims, null, 2));

    const userId = await getUserDbId(userEmail);
    console.log('Article create - Resolved userId:', userId);

    if (!userId) {
      console.error('Article create - Failed to resolve userId for email:', userEmail);
      return response.validationError([{ field: 'user', message: `Unable to identify current user. Email: ${userEmail}` }]);
    }

    // Filter status based on publish permission (content_specialist can only create drafts)
    const finalStatus = filterStatusChange(event, 'articles', status);

    // Validate required fields
    const errors = validation.validateRequired(body, ['title']);
    
    // Validate field lengths
    errors.push(...validation.validateLength(title, 'title', 1, 150));
    errors.push(...validation.validateLength(excerpt, 'excerpt', 0, 300));
    
    // Validate status
    errors.push(...validation.validateEnum(status, 'status', ['draft', 'published']));

    if (errors.length > 0) {
      return response.validationError(errors);
    }

    // Generate slug if not provided
    const finalSlug = slug || validation.generateSlug(title);

    // Check if slug already exists
    const existingSlug = await db.queryOne(
      'SELECT s7b_article_id FROM s7b_article WHERE s7b_article_slug = ? AND s7b_article_deleted_at IS NULL',
      [finalSlug]
    );

    if (existingSlug) {
      return response.validationError([{
        field: 'slug',
        message: 'An article with this slug already exists'
      }]);
    }

    // Map status to active field (use filtered status)
    const activeValue = finalStatus === 'published' ? 1 : 0;
    const premiumValue = premium ? 1 : 0;

    // Prepare section data (up to 5 sections)
    const sectionData = [];
    if (sections && Array.isArray(sections)) {
      for (let i = 0; i < Math.min(sections.length, 5); i++) {
        sectionData.push({
          title: sections[i].title || '',
          content: validation.sanitizeHtml(sections[i].content || '')
        });
      }
    }

    // Ensure at least one section
    if (sectionData.length === 0) {
      sectionData.push({ title: '', content: '' });
    }

    // Begin transaction
    connection = await db.beginTransaction();

    // Insert article
    const insertSql = `
      INSERT INTO s7b_article (
        s7b_article_title, 
        s7b_article_slug, 
        s7b_article_description,
        s7b_article_div1,
        s7b_article_div1_body,
        s7b_article_div2,
        s7b_article_div2_body,
        s7b_article_div3,
        s7b_article_div3_body,
        s7b_article_div4,
        s7b_article_div4_body,
        s7b_article_div5,
        s7b_article_div5_body,
        s7b_article_image,
        s7b_article_active,
        s7b_article_premium,
        s7b_user_id,
        s7b_section_id,
        s7b_article_add_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await connection.execute(insertSql, [
      title,
      finalSlug,
      excerpt || 'Description',
      sectionData[0]?.title || '',
      sectionData[0]?.content || '',
      sectionData[1]?.title || null,
      sectionData[1]?.content || null,
      sectionData[2]?.title || null,
      sectionData[2]?.content || null,
      sectionData[3]?.title || null,
      sectionData[3]?.content || null,
      sectionData[4]?.title || null,
      sectionData[4]?.content || null,
      mainImage || 'no-image.png',
      activeValue,
      premiumValue,
      userId,
      sectionId || null
    ]);

    const articleId = result.insertId;

    // Insert tags if provided
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await connection.execute(
          'INSERT INTO s7b_tags_item (s7b_tags_id, s7b_article_id) VALUES (?, ?)',
          [tagId, articleId]
        );
      }
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    // Fetch the created article
    const createdArticle = await db.queryOne(
      `SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_slug as slug,
        a.s7b_article_description as excerpt,
        a.s7b_article_image as main_image,
        a.s7b_article_active as active,
        a.s7b_article_premium as premium,
        a.s7b_article_add_date as created_at,
        u.s7b_user_name as author_name
      FROM s7b_article a
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE a.s7b_article_id = ?`,
      [articleId]
    );

    return response.success({
      id: createdArticle.id,
      title: createdArticle.title,
      slug: createdArticle.slug,
      excerpt: createdArticle.excerpt,
      mainImage: createdArticle.main_image,
      status: createdArticle.active === 1 ? 'published' : 'draft',
      premium: createdArticle.premium === 1,
      createdAt: createdArticle.created_at,
      author: {
        name: createdArticle.author_name
      }
    }, 201);

  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    console.error('Error creating article:', error);
    return response.error('Failed to create article', 500, error.message);
  }
};

