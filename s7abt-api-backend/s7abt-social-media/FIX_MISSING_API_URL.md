# Fix: Could Not Get API URL from CloudFormation

## 🔍 The Problem

The test script shows:
```
❌ Could not get API URL from CloudFormation
```

This means the CloudFormation stack either:
1. Hasn't been deployed yet
2. Has a different name than expected
3. Failed to deploy

---

## ✅ **Solution: Check and Deploy**

### **Step 1: Check if Stack Exists**

```bash
aws cloudformation list-stacks \
  --region me-central-1 \
  --query 'StackSummaries[?contains(StackName, `s7abt`) && StackStatus != `DELETE_COMPLETE`].[StackName,StackStatus]' \
  --output table
```

This will show all s7abt-related stacks.

---

### **Step 2: Deploy the Stack**

If the stack doesn't exist or failed, deploy it:

```bash
cd /path/to/s7abt-social-media

# Make sure scripts are executable
chmod +x deploy.sh
chmod +x store-openai-key.sh

# Store OpenAI credentials first (if not done)
./store-openai-key.sh

# Deploy the stack
./deploy.sh
```

**Deployment takes**: 5-10 minutes

---

### **Step 3: Verify Deployment**

After deployment completes, check the stack:

```bash
aws cloudformation describe-stacks \
  --stack-name s7abt-social-media-dev \
  --region me-central-1 \
  --query 'Stacks[0].[StackName,StackStatus]' \
  --output table
```

**Expected**: `CREATE_COMPLETE` or `UPDATE_COMPLETE`

---

### **Step 4: Get API URL Manually**

```bash
aws cloudformation describe-stacks \
  --stack-name s7abt-social-media-dev \
  --region me-central-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

**Expected output**: `https://xxxxx.execute-api.me-central-1.amazonaws.com/dev`

---

## 🚀 **Quick Deploy Commands**

If you haven't deployed yet, here's the complete sequence:

```bash
cd /path/to/s7abt-social-media

# 1. Store OpenAI key (if not done)
chmod +x store-openai-key.sh
./store-openai-key.sh

# 2. Deploy
chmod +x deploy.sh
./deploy.sh

# 3. Wait for completion (5-10 minutes)
# The script will show progress

# 4. Test
chmod +x test-api.sh
./test-api.sh
```

---

## 🪟 **Windows Version**

```cmd
cd C:\path\to\s7abt-social-media

REM Deploy
deploy.bat

REM After deployment completes, test
test-api.bat
```

---

## 🔧 **Manual Deployment (If Scripts Don't Work)**

### **1. Store OpenAI Key in Secrets Manager**

Go to AWS Console → Secrets Manager → me-central-1:
1. Click "Store a new secret"
2. Type: "Other type of secret"
3. Add key: `api_key` = `your-openai-key`
4. Secret name: `s7abt/openai/credentials`
5. Click "Store"

### **2. Deploy with SAM CLI**

```bash
cd /path/to/s7abt-social-media

# Build
sam build --template-file template.yaml

# Deploy
sam deploy \
  --template-file template.yaml \
  --stack-name s7abt-social-media-dev \
  --region me-central-1 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides Environment=dev \
  --resolve-s3
```

---

## 📋 **Checklist Before Testing**

- [ ] OpenAI API key stored in Secrets Manager
- [ ] Twitter credentials stored in Secrets Manager
- [ ] CloudFormation stack deployed successfully
- [ ] Stack status is `CREATE_COMPLETE` or `UPDATE_COMPLETE`
- [ ] API Gateway endpoint exists
- [ ] Lambda functions created

---

## 🎯 **Quick Verification Commands**

```bash
# 1. Check stacks
aws cloudformation list-stacks --region me-central-1 --output table

# 2. Check specific stack
aws cloudformation describe-stacks \
  --stack-name s7abt-social-media-dev \
  --region me-central-1

# 3. Check Lambda functions
aws lambda list-functions \
  --region me-central-1 \
  --query 'Functions[?contains(FunctionName, `s7abt`)].FunctionName'

# 4. Check API Gateways
aws apigateway get-rest-apis \
  --region me-central-1 \
  --query 'items[?contains(name, `s7abt`)].name'

# 5. Check Secrets
aws secretsmanager list-secrets \
  --region me-central-1 \
  --query 'SecretList[?contains(Name, `s7abt`)].Name'
```

---

## 💡 **Most Likely Issue**

**You haven't deployed the stack yet!**

The social media automation infrastructure needs to be deployed first before testing.

**Solution**: Run `./deploy.sh` (takes 5-10 minutes)

---

## 📞 **If Deployment Fails**

Share with me:
1. The error message from deploy.sh
2. Output of: `aws cloudformation describe-stack-events --stack-name s7abt-social-media-dev --region me-central-1 --max-items 10`
3. CloudWatch logs if Lambda creation failed

---

## ✅ **After Successful Deployment**

You'll see:
```
==========================================
Deployment Complete!
==========================================

Stack Name: s7abt-social-media-dev
Status: CREATE_COMPLETE

API URL: https://xxxxx.execute-api.me-central-1.amazonaws.com/dev

Resources Created:
  ✅ Tweet Generator Lambda
  ✅ Tweet Publisher Lambda
  ✅ DynamoDB Table
  ✅ API Gateway
  ✅ EventBridge Scheduler

Next Steps:
  1. Test tweet generation: ./test-api.sh
  2. View tweets: aws dynamodb scan --table-name s7abt-tweet-queue-dev
```

---

Run `./deploy.sh` and let me know if you encounter any issues! 🚀

