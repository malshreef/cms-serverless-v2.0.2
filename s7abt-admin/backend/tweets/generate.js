const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('./shared/db');
const { success, error, validationError } = require('./shared/response');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Cache for API key
let anthropicApiKey = null;
let apiKeyCacheTime = 0;
const API_KEY_CACHE_TTL = 300000; // 5 minutes

/**
 * Get Anthropic API key from Secrets Manager
 */
async function getAnthropicApiKey() {
  const now = Date.now();

  if (anthropicApiKey && (now - apiKeyCacheTime) < API_KEY_CACHE_TTL) {
    return anthropicApiKey;
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'me-central-1' });
  const secretName = process.env.ANTHROPIC_SECRET_NAME || 's7abt/anthropic/api-key';

  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    const secret = JSON.parse(response.SecretString);
    anthropicApiKey = secret.api_key || secret.apiKey || secret.ANTHROPIC_API_KEY;
    apiKeyCacheTime = now;

    return anthropicApiKey;
  } catch (err) {
    console.error('Error fetching Anthropic API key:', err);
    throw new Error('Failed to retrieve Anthropic API key from Secrets Manager');
  }
}

/**
 * Generate tweets from an article using Anthropic Claude 3.5
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

    // Generate tweets using Anthropic Claude 3.5
    let tweets;
    try {
      tweets = await generateTweetsWithClaude(article.title, contentPreview, tagNames);
    } catch (aiErr) {
      console.error('Claude API failed, using fallback:', aiErr.message);
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
 * Generate tweets using Anthropic Claude 3.5 Sonnet
 */
async function generateTweetsWithClaude(title, content, tags = []) {
  const apiKey = await getAnthropicApiKey();

  const anthropic = new Anthropic({
    apiKey: apiKey
  });

  const prompt = `أنت خبير في إنشاء محتوى وسائل التواصل الاجتماعي لمنصة "سحابت" المتخصصة في الحوسبة السحابية والتقنية.

مطلوب منك إنشاء 4 تغريدات متنوعة وجذابة من المقال التالي. كل تغريدة يجب أن:
- تكون باللغة العربية مع استخدام المصطلحات التقنية الإنجليزية عند الحاجة
- لا تتجاوز 250 حرف (لترك مساحة للرابط)
- تكون فريدة وتسلط الضوء على جانب مختلف من المقال
- تكون جذابة وتحفز على القراءة والتفاعل
- تتضمن إيموجي واحد أو اثنين مناسبين
- لا تستخدم عبارات مملة مثل "مقال جديد" أو "اقرأ المزيد"

عنوان المقال: ${title}

محتوى المقال:
${content}

${tags.length > 0 ? `الوسوم المرتبطة: ${tags.join(', ')}` : ''}

أنشئ 4 تغريدات بأساليب مختلفة:
1. تغريدة احترافية (professional) تركز على الفائدة العملية
2. تغريدة جذابة (engaging) تطرح سؤالاً مثيراً للتفكير
3. تغريدة تعليمية (educational) تقدم إحصائية أو حقيقة مهمة من المقال
4. تغريدة ودية (friendly) تشجع على النقاش

أعد النتيجة كـ JSON array فقط بدون أي نص إضافي:
[
  {
    "text": "نص التغريدة",
    "tone": "professional|engaging|educational|friendly",
    "hashtags": ["هاشتاق1", "هاشتاق2"]
  }
]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    console.log('Claude Response:', JSON.stringify(response, null, 2));

    // Extract text content
    const textContent = response.content[0].text;

    // Parse JSON from response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }

    const tweets = JSON.parse(jsonMatch[0]);

    // Valid tones for database ENUM
    const validTones = ['professional', 'friendly', 'engaging', 'educational'];

    // Map any invalid tone to a valid one
    const mapTone = (tone) => {
      if (validTones.includes(tone)) return tone;
      // Map common alternatives
      const toneMap = {
        'question': 'engaging',
        'fact': 'educational',
        'informative': 'educational',
        'casual': 'friendly'
      };
      return toneMap[tone] || 'professional';
    };

    // Validate and clean tweets
    return tweets.map(tweet => ({
      text: tweet.text.substring(0, 280),
      tone: mapTone(tweet.tone || 'professional'),
      hashtags: (tweet.hashtags || []).slice(0, 4)
    }));

  } catch (err) {
    console.error('Anthropic API Error:', err);
    throw err;
  }
}

/**
 * Fallback: Generate tweets using templates (if API fails)
 */
function generateTweetsWithTemplate(title, content, tags = []) {
  const tweets = [];
  const hashtags = tags.slice(0, 3).map(tag => tag.replace(/\s+/g, ''));

  // Template 1: Professional
  tweets.push({
    text: `💡 ${title}\n\nتعرف على أحدث المعلومات والتفاصيل في هذا المقال`,
    tone: 'professional',
    hashtags: [...hashtags, 'سحابت', 'CloudComputing']
  });

  // Template 2: Engaging (Question)
  tweets.push({
    text: `🤔 هل تساءلت يوماً عن ${title.substring(0, 80)}؟\n\nالإجابة في هذا المقال`,
    tone: 'engaging',
    hashtags: [...hashtags, 'تقنية']
  });

  // Template 3: Educational (Fact)
  tweets.push({
    text: `📊 ${title}\n\nحقائق وأرقام مهمة تجدها هنا`,
    tone: 'educational',
    hashtags: [...hashtags, 'معلومات']
  });

  // Template 4: Friendly
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
  const targetHour = 12; // 12:00 UTC = 3:00 PM Riyadh (UTC+3)

  const target = new Date(now);
  target.setUTCHours(targetHour, 0, 0, 0);

  if (now >= target) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  return target;
}
