# S7abt Social Media Automation - Deployment Guide

## 🎉 System Ready to Deploy!

Everything is prepared and ready to deploy your automated social media system!

---

## 📦 What's Included

| Component | Description | Status |
|-----------|-------------|--------|
| **Tweet Generator** | Lambda function + OpenAI GPT-4 integration | ✅ Ready |
| **Tweet Publisher** | Lambda function + Twitter API integration | ✅ Ready |
| **DynamoDB Table** | Tweet queue storage | ✅ Ready |
| **EventBridge Scheduler** | Daily trigger at 3 PM Riyadh time | ✅ Ready |
| **API Gateway** | REST API for tweet generation | ✅ Ready |
| **Deployment Scripts** | Automated deployment | ✅ Ready |

---

## 🚀 Quick Deployment (15 Minutes)

### **Step 1: Store OpenAI API Key** (2 minutes)

```bash
cd /path/to/s7abt-social-media
chmod +x store-openai-key.sh
./store-openai-key.sh
```

This stores your OpenAI API key securely in AWS Secrets Manager.

### **Step 2: Deploy the System** (10-15 minutes)

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. ✅ Check prerequisites (AWS CLI, credentials)
2. ✅ Install npm dependencies
3. ✅ Build Lambda functions with SAM
4. ✅ Deploy to AWS CloudFormation
5. ✅ Create all resources (Lambda, DynamoDB, API Gateway, EventBridge)
6. ✅ Display API URL and next steps

### **Step 3: Test the System** (5 minutes)

After deployment, test tweet generation:

```bash
# Replace with your actual API URL from deployment output
curl -X POST https://xxxxx.execute-api.me-central-1.amazonaws.com/dev/generate-tweets \
  -H 'Content-Type: application/json' \
  -d '{
    "article_title": "مقدمة في البنية التحتية كالكود",
    "article_url": "https://s7abt.com/articles/test",
    "article_content": "البنية التحتية كالكود (Infrastructure as Code) هي ممارسة حديثة في إدارة البنية التحتية للحوسبة السحابية..."
  }'
```

---

## 📋 Prerequisites

Before deployment, ensure you have:

- [x] AWS CLI installed and configured
- [x] AWS SAM CLI installed
- [x] Node.js 18+ installed
- [x] Twitter API credentials stored in Secrets Manager (`s7abt/twitter/credentials`)
- [x] OpenAI API key ready

---

## 🔧 Manual Deployment Steps

If you prefer manual deployment or the script doesn't work:

### **1. Store OpenAI API Key**

```bash
aws secretsmanager create-secret \
  --name s7abt/openai/credentials \
  --description "OpenAI API key for S7abt tweet generation" \
  --secret-string '{"api_key":"YOUR_OPENAI_API_KEY_HERE"}' \
  --region me-central-1
```

### **2. Install Dependencies**

```bash
# Tweet Generator
cd tweet-generator
npm install --production
cd ..

# Tweet Publisher
cd tweet-publisher
npm install --production
cd ..
```

### **3. Build with SAM**

```bash
sam build --region me-central-1
```

### **4. Deploy with SAM**

```bash
sam deploy \
  --template-file template.yaml \
  --stack-name s7abt-social-media-dev \
  --region me-central-1 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides Environment=dev \
  --resolve-s3
```

---

## 🧪 Testing

### **Test 1: Generate Tweets**

```bash
# Get API URL from CloudFormation outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name s7abt-social-media-dev \
  --region me-central-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

# Test tweet generation
curl -X POST $API_URL/generate-tweets \
  -H 'Content-Type: application/json' \
  -d '{
    "article_title": "دليل شامل لـ AWS Lambda",
    "article_url": "https://s7abt.com/articles/aws-lambda-guide",
    "article_content": "AWS Lambda هي خدمة حوسبة بدون خادم تتيح لك تشغيل الكود دون الحاجة لإدارة الخوادم..."
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "tweets_generated": 18,
  "article_title": "دليل شامل لـ AWS Lambda",
  "message": "تم إنشاء 18 تغريدة بنجاح",
  "tweets": [...]
}
```

### **Test 2: View Tweet Queue**

```bash
aws dynamodb scan \
  --table-name s7abt-tweet-queue-dev \
  --region me-central-1 \
  --max-items 5
```

### **Test 3: Manually Trigger Publisher**

```bash
aws lambda invoke \
  --function-name s7abt-tweet-publisher-dev \
  --region me-central-1 \
  response.json

cat response.json
```

**Expected Response**:
```json
{
  "success": true,
  "posted": true,
  "twitter_url": "https://twitter.com/user/status/1234567890",
  "article_title": "...",
  "sequence": 1
}
```

---

## 📊 System Architecture

```
┌─────────────────────┐
│   Your Blog CMS     │
│   (New Article)     │
└──────────┬──────────┘
           │
           │ POST /generate-tweets
           ↓
┌─────────────────────────────────┐
│  Lambda: Tweet Generator        │
│  • Calls OpenAI GPT-4           │
│  • Generates 15-20 tweets       │
│  • Stores in DynamoDB           │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  DynamoDB: Tweet Queue          │
│  • status: pending/posted       │
│  • scheduled_time               │
└──────────┬──────────────────────┘
           │
           │ Query pending tweets
           ↓
┌─────────────────────────────────┐
│  EventBridge Scheduler          │
│  • Triggers daily at 3 PM       │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  Lambda: Tweet Publisher        │
│  • Gets next pending tweet      │
│  • Posts to Twitter             │
│  • Updates status to 'posted'   │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  Twitter / X Platform           │
│  • Tweet appears on timeline    │
└─────────────────────────────────┘
```

---

## 🔍 Monitoring

### **CloudWatch Logs**

View logs for each Lambda function:

```bash
# Tweet Generator logs
aws logs tail /aws/lambda/s7abt-tweet-generator-dev \
  --region me-central-1 \
  --follow

# Tweet Publisher logs
aws logs tail /aws/lambda/s7abt-tweet-publisher-dev \
  --region me-central-1 \
  --follow
```

### **DynamoDB Metrics**

Monitor tweet queue:

```bash
# Count pending tweets
aws dynamodb query \
  --table-name s7abt-tweet-queue-dev \
  --index-name status-scheduled_time-index \
  --key-condition-expression "#status = :status" \
  --expression-attribute-names '{"#status":"status"}' \
  --expression-attribute-values '{":status":{"S":"pending"}}' \
  --select COUNT \
  --region me-central-1
```

---

## 💰 Cost Breakdown

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **Lambda (Generator)** | ~10 invocations/month | $0 (free tier) |
| **Lambda (Publisher)** | 30 invocations/month | $0 (free tier) |
| **DynamoDB** | ~500 tweets stored | $0 (free tier) |
| **API Gateway** | ~10 requests/month | $0 (free tier) |
| **EventBridge** | 30 triggers/month | $0 (free tier) |
| **Secrets Manager** | 2 secrets | $0.80/month |
| **OpenAI API** | ~10 articles/month | $5-10/month |
| **Total** | | **$6-11/month** |

---

## 🎯 Usage Workflow

### **Daily Workflow (Automated)**

1. **3 PM Riyadh time**: EventBridge triggers Tweet Publisher
2. **Publisher**: Gets next pending tweet from queue
3. **Publisher**: Posts tweet to Twitter
4. **Publisher**: Updates status to 'posted'
5. **Repeat**: Next day at 3 PM

### **When Publishing New Article**

1. **Publish article** on your blog
2. **Call API** to generate tweets:
   ```bash
   curl -X POST $API_URL/generate-tweets \
     -H 'Content-Type: application/json' \
     -d '{"article_id": "123"}'
   ```
3. **System generates** 15-20 tweets
4. **Tweets queued** for daily posting
5. **Automatic posting** starts the next day

---

## 🔧 Troubleshooting

### **Issue: Deployment fails**

**Solution**:
- Check AWS CLI is configured: `aws sts get-caller-identity`
- Check SAM CLI is installed: `sam --version`
- Check region is correct: `me-central-1`

### **Issue: Tweet generation fails**

**Solution**:
- Check OpenAI API key is valid
- Check CloudWatch logs: `/aws/lambda/s7abt-tweet-generator-dev`
- Verify article content is provided

### **Issue: Tweet posting fails**

**Solution**:
- Check Twitter credentials are correct
- Verify Twitter app has write permissions
- Check CloudWatch logs: `/aws/lambda/s7abt-tweet-publisher-dev`

### **Issue: No tweets being posted**

**Solution**:
- Check EventBridge rule is enabled
- Verify there are pending tweets in DynamoDB
- Check scheduled_time is in the past

---

## 📞 Support

If you encounter any issues:

1. **Check CloudWatch Logs** for error messages
2. **Verify credentials** in Secrets Manager
3. **Test each component** individually
4. **Share error logs** with me for troubleshooting

---

## 🎉 Next Steps

After successful deployment:

1. ✅ **Test tweet generation** with a sample article
2. ✅ **Verify tweets** appear in DynamoDB
3. ✅ **Wait for 3 PM** or manually trigger publisher
4. ✅ **Check Twitter** for posted tweet
5. ✅ **Monitor CloudWatch** for any issues

---

## 🚀 Ready to Deploy!

Run the deployment script and your system will be live in 15 minutes! 🎯

```bash
./store-openai-key.sh
./deploy.sh
```

Let me know if you encounter any issues during deployment! 🎉

