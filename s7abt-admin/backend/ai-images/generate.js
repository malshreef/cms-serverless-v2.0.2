const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { success, error } = require('../shared/response');
const crypto = require('crypto');
const https = require('https');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.MEDIA_BUCKET || 's7abt-media';

// Cache the API key across invocations
let cachedApiKey = null;

async function getOpenAIKey() {
  if (cachedApiKey) return cachedApiKey;

  const secretName = process.env.OPENAI_SECRET_NAME || 's7abt/openai/credentials';
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  const secret = JSON.parse(response.SecretString);
  cachedApiKey = secret.OPENAI_API_KEY || secret.apiKey || secret.api_key;
  return cachedApiKey;
}

/**
 * Generate 3 AI images using DALL-E based on article/news content
 * POST /admin/ai/generate-images
 * Body: { title, content, type: 'article'|'news' }
 * Returns: { images: [{ key, url }] }
 */
exports.handler = async (event) => {
  console.log('AI Image Generation request:', JSON.stringify(event, null, 2));

  try {
    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      return error('AI image generation is not configured (missing API key)', 500);
    }

    const body = JSON.parse(event.body || '{}');
    const { title, content, type = 'article' } = body;

    if (!title) {
      return error('Title is required to generate images', 400);
    }

    // Build a prompt from the article/news content
    const prompt = buildPrompt(title, content, type);
    console.log('Generated prompt:', prompt);

    // Generate 3 images in parallel (DALL-E 3 only supports n=1, so we make 3 calls)
    const imagePromises = [0, 1, 2].map(i => generateImage(apiKey, prompt, i));
    const imageResults = await Promise.allSettled(imagePromises);

    const images = [];
    for (let i = 0; i < imageResults.length; i++) {
      const result = imageResults[i];
      if (result.status === 'fulfilled' && result.value) {
        // Upload to S3
        const folder = type === 'news' ? 'news' : 'articles';
        const fileKey = `${folder}/ai-generated/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${i}.png`;

        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: result.value,
          ContentType: 'image/png',
          Metadata: {
            'generated-by': 'dall-e-3',
            'source-title': encodeURIComponent(title.substring(0, 100)),
            'generated-at': new Date().toISOString()
          }
        }));

        const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        images.push({ key: fileKey, url: publicUrl });
      } else {
        console.error(`Image ${i} generation failed:`, result.reason);
      }
    }

    if (images.length === 0) {
      return error('Failed to generate any images. Please try again.', 500);
    }

    return success({ images });

  } catch (err) {
    console.error('Error in AI image generation:', err);
    return error('Failed to generate images: ' + err.message, 500);
  }
};

/**
 * Build a DALL-E prompt from article content
 */
function buildPrompt(title, content, type) {
  // Strip HTML tags from content if present
  const cleanContent = (content || '').replace(/<[^>]*>/g, '').substring(0, 300);

  const basePrompt = type === 'news'
    ? `Professional news article header image for: "${title}". ${cleanContent ? `Context: ${cleanContent}.` : ''}`
    : `Professional blog article featured image for: "${title}". ${cleanContent ? `Context: ${cleanContent}.` : ''}`;

  return `${basePrompt} Style: Modern, clean, professional tech blog illustration. High quality, suitable as a website header image. No text or watermarks in the image.`;
}

/**
 * Call OpenAI DALL-E API to generate one image
 */
function generateImage(apiKey, prompt, index) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'b64_json'
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.error(`DALL-E API error (image ${index}):`, res.statusCode, data);
            reject(new Error(`DALL-E API returned ${res.statusCode}`));
            return;
          }
          const parsed = JSON.parse(data);
          const b64 = parsed.data?.[0]?.b64_json;
          if (!b64) {
            reject(new Error('No image data in response'));
            return;
          }
          resolve(Buffer.from(b64, 'base64'));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('DALL-E request timed out'));
    });
    req.write(requestBody);
    req.end();
  });
}
