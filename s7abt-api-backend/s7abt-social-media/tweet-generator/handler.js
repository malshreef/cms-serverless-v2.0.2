/**
 * S7abt Tweet Generator Lambda Function
 * Generates 15-20 Arabic tweets from blog articles using OpenAI GPT-4
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.TWEET_QUEUE_TABLE;
const OPENAI_SECRET_NAME = process.env.OPENAI_SECRET_NAME || 's7abt/openai/credentials';

// Cache for OpenAI client
let openaiClient = null;

/**
 * Get OpenAI API key from Secrets Manager
 */
async function getOpenAIKey() {
  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: OPENAI_SECRET_NAME })
    );
    
    const secret = JSON.parse(response.SecretString);
    return secret.api_key;
  } catch (error) {
    console.error('Error fetching OpenAI key:', error);
    throw new Error('Failed to retrieve OpenAI credentials');
  }
}

/**
 * Initialize OpenAI client
 */
async function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = await getOpenAIKey();
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate tweets using OpenAI GPT-4
 */
async function generateTweets(articleContent, articleUrl, articleTitle) {
  const client = await getOpenAIClient();
  
  const prompt = `أنت خبير في إنشاء تغريدات تقنية جذابة باللغة العربية لمدونة سحابية متخصصة في الحوسبة السحابية.

المقال:
العنوان: ${articleTitle}
الرابط: ${articleUrl}
المحتوى: ${articleContent.substring(0, 3000)}

المطلوب:
أنشئ 18 تغريدة مختلفة باللغة العربية عن هذا المقال. يجب أن تكون التغريدات:

1. **التنوع في الأسلوب**: اخلط بين الأسلوب الاحترافي والأسلوب الودي/الجذاب
2. **الطول**: كل تغريدة يجب ألا تتجاوز 240 حرفاً (لترك مساحة للرابط)
3. **الهاشتاجات**: أضف 2-4 هاشتاجات ذات صلة باللغة العربية والإنجليزية
4. **المحتوى**: 
   - بعض التغريدات تسلط الضوء على نقاط رئيسية
   - بعضها يطرح أسئلة تحفيزية
   - بعضها يقدم نصائح سريعة
   - بعضها يشارك إحصائيات أو حقائق مثيرة
5. **الرموز التعبيرية**: استخدم 1-2 إيموجي مناسب في كل تغريدة
6. **الدعوة للعمل**: بعض التغريدات يجب أن تشجع على قراءة المقال

تنسيق الإخراج:
أرجع JSON array فقط، كل عنصر يحتوي على:
{
  "text": "نص التغريدة",
  "tone": "professional" أو "casual",
  "hashtags": ["هاشتاج1", "هاشتاج2"]
}

مثال على الأسلوب الاحترافي:
"تعرف على أفضل ممارسات Infrastructure as Code في AWS. دليل شامل لاستخدام Terraform و CloudFormation. 📚 #AWS #IaC #السحابة"

مثال على الأسلوب الودي:
"💡 نصيحة اليوم: استخدم Terraform لإدارة بنيتك التحتية بسهولة! شاهد كيف في المقال الجديد 👇 #AWS #Terraform"

أنشئ 18 تغريدة متنوعة الآن:`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini (available on all accounts, cheaper, fast)
      messages: [
        {
          role: 'system',
          content: 'أنت خبير في إنشاء محتوى تقني جذاب على تويتر باللغة العربية. تخصصك هو الحوسبة السحابية و DevOps.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    
    // Parse the JSON response
    let tweets;
    try {
      const parsed = JSON.parse(content);
      // Handle different possible response formats
      tweets = parsed.tweets || parsed.data || parsed;
      if (!Array.isArray(tweets)) {
        tweets = Object.values(tweets);
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Response content:', content);
      throw new Error('Failed to parse AI response');
    }

    return tweets;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Store tweets in DynamoDB
 */
async function storeTweets(tweets, articleId, articleUrl, articleTitle) {
  const storedTweets = [];
  const now = Date.now();
  
  for (let i = 0; i < tweets.length; i++) {
    const tweet = tweets[i];
    const tweetId = uuidv4();
    
    // Add article link to tweet text
    const tweetText = `${tweet.text}\n\n${articleUrl}`;
    
    // Ensure tweet doesn't exceed 280 characters
    const finalTweetText = tweetText.length > 280 
      ? `${tweet.text.substring(0, 240)}...\n\n${articleUrl}`
      : tweetText;
    
    const item = {
      tweet_id: tweetId,
      article_id: articleId,
      article_title: articleTitle,
      article_url: articleUrl,
      tweet_text: finalTweetText,
      original_text: tweet.text,
      tone: tweet.tone || 'professional',
      hashtags: tweet.hashtags || [],
      status: 'pending',
      scheduled_time: now + (i * 24 * 60 * 60 * 1000), // Spread over days
      created_at: now,
      sequence: i + 1
    };
    
    try {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));
      storedTweets.push(item);
    } catch (error) {
      console.error(`Error storing tweet ${i + 1}:`, error);
      // Continue with other tweets even if one fails
    }
  }
  
  return storedTweets;
}

/**
 * Fetch article content from your API
 */
async function fetchArticleContent(articleId) {
  // This would call your existing S7abt API to get article details
  const apiUrl = process.env.S7ABT_API_URL || 'https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev';
  
  try {
    const response = await fetch(`${apiUrl}/articles/${articleId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }
    
    const article = await response.json();
    return {
      title: article.title,
      content: article.content || article.body || article.description,
      url: article.url || `https://s7abt.com/articles/${articleId}`
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    throw new Error(`Failed to fetch article content: ${error.message}`);
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Parse input
    let body;
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      body = event;
    }
    
    const { article_id, article_url, article_title, article_content } = body;
    
    if (!article_id && !article_url) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'MISSING_PARAMETERS',
          message: 'Either article_id or article_url is required'
        })
      };
    }
    
    // Fetch article content if not provided
    let articleData;
    if (article_content && article_title && article_url) {
      articleData = {
        title: article_title,
        content: article_content,
        url: article_url
      };
    } else if (article_id) {
      articleData = await fetchArticleContent(article_id);
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'INSUFFICIENT_DATA',
          message: 'Please provide either article_id or (article_title, article_content, article_url)'
        })
      };
    }
    
    console.log('Generating tweets for article:', articleData.title);
    
    // Generate tweets using OpenAI
    const tweets = await generateTweets(
      articleData.content,
      articleData.url,
      articleData.title
    );
    
    console.log(`Generated ${tweets.length} tweets`);
    
    // Store tweets in DynamoDB
    const storedTweets = await storeTweets(
      tweets,
      article_id || 'manual',
      articleData.url,
      articleData.title
    );
    
    console.log(`Stored ${storedTweets.length} tweets in DynamoDB`);
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        tweets_generated: storedTweets.length,
        article_id: article_id || 'manual',
        article_title: articleData.title,
        message: `تم إنشاء ${storedTweets.length} تغريدة بنجاح`,
        tweets: storedTweets.map(t => ({
          tweet_id: t.tweet_id,
          text: t.tweet_text,
          tone: t.tone,
          hashtags: t.hashtags,
          sequence: t.sequence
        }))
      })
    };
    
  } catch (error) {
    console.error('Error in tweet generation:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to generate tweets. Please try again later.',
        details: error.message
      })
    };
  }
};

