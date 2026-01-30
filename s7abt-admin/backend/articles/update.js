const db = require('./shared/db');
const response = require('./shared/response');
const validation = require('./shared/validation');
const { authorizeWithOwnership, filterStatusChange } = require('./shared/authorize');

/**
 * Update an existing article
 * Compatible with existing s7abt.com schema
 */
exports.handler = async (event) => {
  let connection;

  try {
    console.log('Update article event:', JSON.stringify(event));

    const articleId = event.pathParameters?.id;

    if (!articleId) {
      return response.validationError([{ field: 'id', message: 'Article ID is required' }]);
    }

    // Check if article exists
    const existingArticle = await db.queryOne(
      'SELECT s7b_article_id, s7b_article_slug, s7b_user_id FROM s7b_article WHERE s7b_article_id = ? AND s7b_article_deleted_at IS NULL',
      [articleId]
    );

    if (!existingArticle) {
      return response.notFound('Article');
    }

    // Check authorization with ownership
    const auth = await authorizeWithOwnership(
      event,
      'articles',
      'update',
      's7b_article',
      's7b_article_id',
      articleId
    );

    if (!auth.authorized) {
      return auth.response;
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      title,
      slug,
      excerpt,
      sections, // Array of {title, content} objects
      mainImage,
      status,
      premium,
      sectionId,
      tagIds
    } = body;

    // Validate if provided
    const errors = [];
    
    if (title) {
      errors.push(...validation.validateLength(title, 'title', 1, 150));
    }
    
    if (excerpt) {
      errors.push(...validation.validateLength(excerpt, 'excerpt', 0, 300));
    }
    
    if (status) {
      errors.push(...validation.validateEnum(status, 'status', ['draft', 'published']));
    }

    if (errors.length > 0) {
      return response.validationError(errors);
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingArticle.s7b_article_slug) {
      const existingSlug = await db.queryOne(
        'SELECT s7b_article_id FROM s7b_article WHERE s7b_article_slug = ? AND s7b_article_id != ? AND s7b_article_deleted_at IS NULL',
        [slug, articleId]
      );

      if (existingSlug) {
        return response.validationError([{
          field: 'slug',
          message: 'An article with this slug already exists'
        }]);
      }
    }

    // Begin transaction
    connection = await db.beginTransaction();

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('s7b_article_title = ?');
      params.push(title);
    }
    if (slug !== undefined) {
      updates.push('s7b_article_slug = ?');
      params.push(slug);
    }
    if (excerpt !== undefined) {
      updates.push('s7b_article_description = ?');
      params.push(excerpt);
    }
    if (mainImage !== undefined) {
      updates.push('s7b_article_image = ?');
      params.push(mainImage);
    }
    if (status !== undefined) {
      // Filter status based on publish permission
      const allowedStatus = filterStatusChange(event, 'articles', status);
      const activeValue = allowedStatus === 'published' ? 1 : 0;
      updates.push('s7b_article_active = ?');
      params.push(activeValue);
    }
    if (sectionId !== undefined) {
      updates.push('s7b_section_id = ?');
      params.push(sectionId);
    }
    if (premium !== undefined) {
      const premiumValue = premium ? 1 : 0;
      updates.push('s7b_article_premium = ?');
      params.push(premiumValue);
    }

    // Update sections if provided
    if (sections && Array.isArray(sections)) {
      for (let i = 0; i < Math.min(sections.length, 5); i++) {
        const divNum = i + 1;
        updates.push(`s7b_article_div${divNum} = ?`);
        params.push(sections[i].title || '');
        updates.push(`s7b_article_div${divNum}_body = ?`);
        params.push(validation.sanitizeHtml(sections[i].content || ''));
      }
    }

    // Always update updated_at
    updates.push('s7b_article_updated_at = NOW()');
    params.push(articleId);

    if (updates.length > 1) { // More than just updated_at
      const updateSql = `
        UPDATE s7b_article 
        SET ${updates.join(', ')}
        WHERE s7b_article_id = ? AND s7b_article_deleted_at IS NULL
      `;
      await connection.execute(updateSql, params);
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      // Delete existing tags
      await connection.execute(
        'DELETE FROM s7b_tags_item WHERE s7b_article_id = ?',
        [articleId]
      );

      // Insert new tags
      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          await connection.execute(
            'INSERT INTO s7b_tags_item (s7b_tags_id, s7b_article_id) VALUES (?, ?)',
            [tagId, articleId]
          );
        }
      }
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    // Fetch the updated article
    const updatedArticle = await db.queryOne(
      `SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_slug as slug,
        a.s7b_article_description as excerpt,
        a.s7b_article_image as main_image,
        a.s7b_article_active as active,
        a.s7b_article_premium as premium,
        a.s7b_article_updated_at as updated_at,
        u.s7b_user_name as author_name
      FROM s7b_article a
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE a.s7b_article_id = ?`,
      [articleId]
    );

    return response.success({
      id: updatedArticle.id,
      title: updatedArticle.title,
      slug: updatedArticle.slug,
      excerpt: updatedArticle.excerpt,
      mainImage: updatedArticle.main_image,
      status: updatedArticle.active === 1 ? 'published' : 'draft',
      premium: updatedArticle.premium === 1,
      updatedAt: updatedArticle.updated_at,
      author: {
        name: updatedArticle.author_name
      }
    });

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
    
    console.error('Error updating article:', error);
    return response.error('Failed to update article', 500, error.message);
  }
};

