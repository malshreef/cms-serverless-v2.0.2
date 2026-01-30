# Troubleshooting API Errors

## 🔍 Common Errors and Solutions

### **Error 1: "Missing Authentication Token"**

**Symptoms**:
```json
{"message":"Missing Authentication Token"}
```

**Causes**:
1. ❌ Wrong API endpoint path
2. ❌ API Gateway not deployed
3. ❌ Incorrect HTTP method

**Solutions**:

#### **Solution A: Get Correct API URL**

```bash
# Get API URL from CloudFormation
aws cloudformation describe-stacks \
  --stack-name s7abt-social-media-dev \
  --region me-central-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

The URL should look like:
```
https://xxxxx.execute-api.me-central-1.amazonaws.com/dev
```

#### **Solution B: Use Test Script**

```bash
cd /path/to/s7abt-social-media
chmod +x test-api.sh
./test-api.sh
```

The script automatically gets the correct URL and tests it.

#### **Solution C: Check API Gateway**

1. Go to: https://console.aws.amazon.com/apigateway/
2. Region: **me-central-1**
3. Find API: **s7abt-social-media-api-dev**
4. Click **Stages** → **dev**
5. Copy the **Invoke URL**
6. Test: `curl -X POST {INVOKE_URL}/generate-tweets ...`

---

### **Error 2: "Could not resolve host"**

**Symptoms**:
```
curl: (6) Could not resolve host: ..
```

**Cause**: Syntax error in curl command (usually line continuation `\` in Windows)

**Solutions**:

#### **For Windows Command Prompt**:

Use the batch script or put everything on one line:

```cmd
curl -X POST "https://xxxxx.execute-api.me-central-1.amazonaws.com/dev/generate-tweets" -H "Content-Type: application/json" -d "{\"article_title\": \"test\", \"article_url\": \"https://s7abt.com/test\", \"article_content\": \"test content\"}"
```

#### **For Git Bash**:

Use the shell script or proper line continuation:

```bash
curl -X POST "https://xxxxx.execute-api.me-central-1.amazonaws.com/dev/generate-tweets" \
  -H "Content-Type: application/json" \
  -d '{
    "article_title": "test",
    "article_url": "https://s7abt.com/test",
    "article_content": "test content"
  }'
```

---

### **Error 3: Internal Server Error (500)**

**Symptoms**:
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "..."
}
```

**Solutions**:

#### **Check CloudWatch Logs**:

```bash
aws logs tail /aws/lambda/s7abt-tweet-generator-dev \
  --region me-central-1 \
  --since 10m
```

Common issues:
- ❌ OpenAI API key not set
- ❌ Missing npm dependencies
- ❌ Lambda timeout

---

## 🚀 **Quick Test Methods**

### **Method 1: Use Test Script** (Recommended)

**Linux/Mac/Git Bash**:
```bash
./test-api.sh
```

**Windows**:
```cmd
test-api.bat
```

### **Method 2: Manual curl (One Line)**

```bash
API_URL="https://xxxxx.execute-api.me-central-1.amazonaws.com/dev" && curl -X POST "$API_URL/generate-tweets" -H "Content-Type: application/json" -d '{"article_title":"test","article_url":"https://s7abt.com/test","article_content":"test content about AWS Lambda and cloud computing"}'
```

### **Method 3: AWS Lambda Direct Invoke**

Bypass API Gateway and test Lambda directly:

```bash
aws lambda invoke \
  --function-name s7abt-tweet-generator-dev \
  --region me-central-1 \
  --payload '{"article_title":"test","article_url":"https://s7abt.com/test","article_content":"test content"}' \
  response.json

cat response.json
```

---

## 📋 **Checklist**

Before testing, verify:

- [ ] Stack deployed successfully
  ```bash
  aws cloudformation describe-stacks --stack-name s7abt-social-media-dev --region me-central-1
  ```

- [ ] Lambda function exists
  ```bash
  aws lambda get-function --function-name s7abt-tweet-generator-dev --region me-central-1
  ```

- [ ] OpenAI secret exists
  ```bash
  aws secretsmanager describe-secret --secret-id s7abt/openai/credentials --region me-central-1
  ```

- [ ] DynamoDB table exists
  ```bash
  aws dynamodb describe-table --table-name s7abt-tweet-queue-dev --region me-central-1
  ```

---

## 🔧 **Common Fixes**

### **Fix 1: Redeploy API Gateway**

Sometimes API Gateway stage doesn't deploy properly:

```bash
cd /path/to/s7abt-social-media
./deploy.sh
```

### **Fix 2: Update Lambda Function**

If Lambda code is outdated:

```bash
cd /path/to/s7abt-social-media
./update-lambda.sh
```

### **Fix 3: Check Lambda Permissions**

Lambda needs permissions to access Secrets Manager and DynamoDB:

```bash
aws lambda get-function \
  --function-name s7abt-tweet-generator-dev \
  --region me-central-1 \
  --query 'Configuration.Role'
```

---

## 📊 **Expected Successful Response**

```json
{
  "success": true,
  "tweets_generated": 18,
  "article_id": "manual",
  "article_title": "دليل شامل لـ AWS Lambda",
  "message": "تم إنشاء 18 تغريدة بنجاح",
  "tweets": [
    {
      "tweet_id": "uuid-here",
      "text": "تعرف على AWS Lambda...",
      "tone": "professional",
      "hashtags": ["#AWS", "#Lambda", "#السحابة"],
      "sequence": 1
    },
    ...
  ]
}
```

---

## 💡 **Quick Debug Commands**

```bash
# 1. Get API URL
aws cloudformation describe-stacks \
  --stack-name s7abt-social-media-dev \
  --region me-central-1 \
  --query 'Stacks[0].Outputs'

# 2. Test Lambda directly
aws lambda invoke \
  --function-name s7abt-tweet-generator-dev \
  --region me-central-1 \
  --payload '{"article_title":"test","article_url":"https://s7abt.com","article_content":"test"}' \
  response.json && cat response.json

# 3. Check recent logs
aws logs tail /aws/lambda/s7abt-tweet-generator-dev \
  --region me-central-1 \
  --since 5m

# 4. List API Gateway APIs
aws apigateway get-rest-apis --region me-central-1

# 5. Check DynamoDB table
aws dynamodb scan \
  --table-name s7abt-tweet-queue-dev \
  --region me-central-1 \
  --max-items 5
```

---

## 🎯 **Still Having Issues?**

If none of the above works:

1. **Share with me**:
   - The exact error message
   - CloudWatch logs
   - Stack outputs

2. **Check AWS Console**:
   - CloudFormation: Stack status
   - Lambda: Function configuration
   - API Gateway: Deployment status
   - CloudWatch: Recent logs

3. **Try direct Lambda invoke**:
   - Bypasses API Gateway
   - Helps isolate the issue

---

Use the test scripts - they handle all the complexity for you! 🚀

