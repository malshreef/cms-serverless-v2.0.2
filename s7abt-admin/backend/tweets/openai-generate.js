const { OpenAI } = require('openai');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let openaiClient = null;
let apiKeyCacheTime = 0;
const API_KEY_CACHE_TTL = 300000;

async function getOpenAIClient() {
  const now = Date.now();
  if (openaiClient && (now - apiKeyCacheTime) < API_KEY_CACHE_TTL) {
    return openaiClient;
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const secretName = process.env.OPENAI_SECRET_NAME || 's7abt/openai/credentials';

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  const secret = JSON.parse(response.SecretString);
  openaiClient = new OpenAI({ apiKey: secret.api_key });
  apiKeyCacheTime = now;
  return openaiClient;
}

exports.handler = async (event) => {
  const { title, content, tags } = event;

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

${tags && tags.length > 0 ? `الوسوم المرتبطة: ${tags.join(', ')}` : ''}

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

  const client = await getOpenAIClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'أنت خبير في إنشاء محتوى تقني جذاب على تويتر باللغة العربية. تخصصك هو الحوسبة السحابية و DevOps.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  console.log('OpenAI Response received');
  const textContent = response.choices[0].message.content;

  const jsonMatch = textContent.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No valid JSON array found in response');
  }

  const tweets = JSON.parse(jsonMatch[0]);

  const validTones = ['professional', 'friendly', 'engaging', 'educational'];
  const mapTone = (tone) => {
    if (validTones.includes(tone)) return tone;
    const toneMap = { 'question': 'engaging', 'fact': 'educational', 'informative': 'educational', 'casual': 'friendly' };
    return toneMap[tone] || 'professional';
  };

  return tweets.map(tweet => ({
    text: tweet.text.substring(0, 280),
    tone: mapTone(tweet.tone || 'professional'),
    hashtags: (tweet.hashtags || []).slice(0, 4)
  }));
};
