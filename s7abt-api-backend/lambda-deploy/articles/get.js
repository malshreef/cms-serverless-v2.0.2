const db = require('../shared/db');
const { success, error } = require('../shared/response');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const articleId = event.pathParameters?.id;
    
    if (!articleId) {
      return error('Article ID is required', null, 400);
    }
    
    const connection = await db.getConnection();
    
    // Get article with correct table and column names
    const articleQuery = `
      SELECT 
        a.s7b_article_id as id,
        a.s7b_article_title as title,
        a.s7b_article_description as description,
        a.s7b_article_image as image,
        a.s7b_article_div1 as div1Title,
        a.s7b_article_div1_body as div1Body,
        a.s7b_article_div2 as div2Title,
        a.s7b_article_div2_body as div2Body,
        a.s7b_article_div3 as div3Title,
        a.s7b_article_div3_body as div3Body,
        a.s7b_article_div4 as div4Title,
        a.s7b_article_div4_body as div4Body,
        a.s7b_article_div5 as div5Title,
        a.s7b_article_div5_body as div5Body,
        a.s7b_section_id as sectionId,
        a.s7b_user_id as userId,
        a.s7b_article_add_date as createdAt,
        a.s7b_article_active as active,
        s.s7b_section_title as sectionName,
        u.s7b_user_name as authorName,
        u.s7b_user_username as authorUsername,
        u.s7b_user_image as authorImage,
        u.s7b_user_brief as authorBrief,
        u.s7b_user_twitter as authorTwitter,
        u.s7b_user_facebook as authorFacebook,
        u.s7b_user_linkedin as authorLinkedin
      FROM s7b_article a
      LEFT JOIN s7b_section s ON a.s7b_section_id = s.s7b_section_id
      LEFT JOIN s7b_user u ON a.s7b_user_id = u.s7b_user_id
      WHERE a.s7b_article_id = ? AND a.s7b_article_active = 1
    `;
    
    const [articles] = await connection.execute(articleQuery, [articleId]);
    
    if (articles.length === 0) {
      await connection.end();
      return error('Article not found', null, 404);
    }
    
    const article = articles[0];
    
    // Get tags for this article
    const tagsQuery = `
      SELECT 
        t.s7b_tags_id as id,
        t.s7b_tags_name as name
      FROM s7b_tags t
      INNER JOIN s7b_tags_item ti ON t.s7b_tags_id = ti.s7b_tags_id
      WHERE ti.s7b_article_id = ?
    `;
    
    const [tags] = await connection.execute(tagsQuery, [articleId]);
    article.tags = tags;
    
    // Get comments for this article
    const commentsQuery = `
      SELECT 
        s7b_comment_id as id,
        s7b_comment_user_name as authorName,
        s7b_comment_user_email as authorEmail,
        s7b_comment_body as body,
        s7b_comment_image as authorImage,
        s7b_comment_add_date as createdAt,
        s7b_comment_active as active
      FROM s7b_comment
      WHERE s7b_article_id = ? AND s7b_comment_active = 1
      ORDER BY s7b_comment_add_date DESC
    `;
    
    const [comments] = await connection.execute(commentsQuery, [articleId]);
    article.comments = comments;
    
    await connection.end();
    
    return success({ article });
    
  } catch (err) {
    console.error('Error:', err);
    return error('Failed to fetch article', err.message);
  }
};
