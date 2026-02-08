const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('./shared/db');
const { success, error, validationError } = require('./shared/response');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable is not set');
}
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
const OPENAI_FUNCTION_NAME = process.env.OPENAI_FUNCTION_NAME || 's7abt-admin-openai-generate-tweets-prod';

/**
 * Generate tweets from an article using OpenAI (via non-VPC Lambda)
 */
exports.handler = async (event) => {
  console.log('Generate Tweets Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { articleId, article_title, article_url } = body;

    // Validate input
    if (!articleId) {
      return validationError('Article ID is required');
    }

    // Fetch article from database
    const article = await queryOne(
      `SELECT
        s7b_article_id as id,
        s7b_article_title as title,
        s7b_article_description as excerpt,
        CONCAT(
          COALESCE(s7b_article_div1_body, ''),
          COALESCE(s7b_article_div2_body, ''),
          COALESCE(s7b_article_div3_body, ''),
          COALESCE(s7b_article_div4_body, ''),
          COALESCE(s7b_article_div5_body, '')
        ) as content,
        s7b_section_id as section_id
      FROM s7b_article
      WHERE s7b_article_id = ? AND s7b_article_active = 1`,
      [articleId]
    );

    if (!article) {
      return error('Article not found or inactive', 404);
    }

    // Get article tags
    let tags = [];
    try {
      tags = await query(
        `SELECT t.s7b_tags_name as name
         FROM s7b_tags_item ti
         JOIN s7b_tags t ON ti.s7b_tags_id = t.s7b_tags_id
         WHERE ti.s7b_article_id = ?`,
        [articleId]
      );
    } catch (tagErr) {
      console.warn('Could not fetch tags:', tagErr.message);
    }

    const tagNames = tags.map(t => t.name);

    // Prepare content for AI (truncate if too long)
    const contentPreview = article.content
      ? article.content.substring(0, 3000) + (article.content.length > 3000 ? '...' : '')
      : article.excerpt;

    // Generate tweets via non-VPC OpenAI Lambda
    let tweets;
    try {
      tweets = await invokeOpenAILambda(article.title, contentPreview, tagNames);
    } catch (aiErr) {
      console.error('OpenAI Lambda failed, using fallback:', aiErr.message);
      tweets = generateTweetsWithTemplate(article.title, contentPreview, tagNames);
    }

    if (!tweets || tweets.length === 0) {
      console.error('Failed to generate tweets from article');
      return error('Failed to generate tweets from article');
    }

    // Calculate scheduling times (3:00 PM Riyadh = 12:00 UTC, one per day)
    const baseScheduleTime = getNextScheduleTime();

    // Save tweets to database
    const savedTweets = [];
    const totalTweets = tweets.length;

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      const tweetId = uuidv4();

      // Schedule each tweet for consecutive days
      const scheduledTime = new Date(baseScheduleTime.getTime() + (i * 24 * 60 * 60 * 1000));

      await query(
        `INSERT INTO s7b_tweets (
          s7b_tweet_id,
          s7b_article_id,
          s7b_tweet_text,
          s7b_tweet_tone,
          s7b_tweet_hashtags,
          s7b_tweet_sequence,
          s7b_tweet_total_in_batch,
          s7b_tweet_status,
          s7b_tweet_scheduled_time,
          s7b_article_title,
          s7b_article_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [
          tweetId,
          articleId,
          tweet.text,
          tweet.tone || 'professional',
          JSON.stringify(tweet.hashtags || []),
          i + 1,
          totalTweets,
          scheduledTime,
          article.title,
          article_url || `${process.env.SITE_URL || 'https://your-domain.com'}/articles/${articleId}`
        ]
      );

      savedTweets.push({
        tweet_id: tweetId,
        tweet_text: tweet.text,
        tone: tweet.tone,
        hashtags: tweet.hashtags,
        sequence: i + 1,
        scheduled_time: scheduledTime.toISOString()
      });
    }

    console.log(`Successfully generated and saved ${savedTweets.length} tweets for article ${articleId}`);

    return success({
      message: `Generated ${savedTweets.length} tweets successfully`,
      tweets: savedTweets,
      article: {
        id: article.id,
        title: article.title
      }
    });

  } catch (err) {
    console.error('Error generating tweets:', err);
    return error('Failed to generate tweets: ' + err.message, 500);
  }
};

/**
 * Invoke the non-VPC OpenAI Lambda to generate tweets
 */
async function invokeOpenAILambda(title, content, tags) {
  const response = await lambdaClient.send(new InvokeCommand({
    FunctionName: OPENAI_FUNCTION_NAME,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({ title, content, tags }),
  }));

  const payload = JSON.parse(Buffer.from(response.Payload).toString());

  if (response.FunctionError) {
    throw new Error(payload.errorMessage || 'OpenAI Lambda invocation failed');
  }

  return payload;
}

/**
 * Fallback: Generate tweets using templates (if API fails)
 */
function generateTweetsWithTemplate(title, content, tags = []) {
  const tweets = [];
  const hashtags = tags.slice(0, 3).map(tag => tag.replace(/\s+/g, ''));

  tweets.push({
    text: `💡 ${title}\n\nتعرف على أحدث المعلومات والتفاصيل في هذا المقال`,
    tone: 'professional',
    hashtags: [...hashtags, 'سحابت', 'CloudComputing']
  });

  tweets.push({
    text: `🤔 هل تساءلت يوماً عن ${title.substring(0, 80)}؟\n\nالإجابة في هذا المقال`,
    tone: 'engaging',
    hashtags: [...hashtags, 'تقنية']
  });

  tweets.push({
    text: `📊 ${title}\n\nحقائق وأرقام مهمة تجدها هنا`,
    tone: 'educational',
    hashtags: [...hashtags, 'معلومات']
  });

  tweets.push({
    text: `🚀 ${title}\n\nشاركنا رأيك في التعليقات!`,
    tone: 'friendly',
    hashtags: [...hashtags, 'سحابت']
  });

  return tweets;
}

/**
 * Calculate next schedule time (3:00 PM Riyadh = 12:00 UTC)
 */
function getNextScheduleTime() {
  const now = new Date();
  const targetHour = 12;

  const target = new Date(now);
  target.setUTCHours(targetHour, 0, 0, 0);

  if (now >= target) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  return target;
}
