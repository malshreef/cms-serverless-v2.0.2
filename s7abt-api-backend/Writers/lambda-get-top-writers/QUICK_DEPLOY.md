# Quick Deployment Guide - Get Top Writers Lambda

This guide will help you deploy the Lambda function in **5 minutes**.

## ✅ Prerequisites Checklist

- [ ] AWS CLI installed and configured
- [ ] Node.js 18.x or higher installed
- [ ] Database credentials stored in AWS Secrets Manager
- [ ] Lambda execution role with required permissions

## 🚀 5-Minute Deployment

### Step 1: Install Dependencies (1 min)

```bash
cd lambda-get-top-writers
npm install
```

### Step 2: Test Locally (Optional - 2 min)

```bash
# Set environment variables
export DB_SECRET_ARN="arn:aws:secretsmanager:me-central-1:ACCOUNT_ID:secret:your-secret"
export AWS_REGION="me-central-1"

# Run test
node test-local.js
```

### Step 3: Deploy (2 min)

```bash
# Make script executable
chmod +x deploy.sh

# Deploy
./deploy.sh
```

### Step 4: Configure Environment Variables

In AWS Lambda Console:
1. Go to **Configuration** → **Environment variables**
2. Add:
   - `DB_SECRET_ARN` = Your Secrets Manager ARN
   - `AWS_REGION` = `me-central-1`

### Step 5: Test in Lambda Console

Use this test event:

```json
{
  "httpMethod": "GET",
  "headers": {
    "Content-Type": "application/json"
  },
  "requestContext": {
    "http": {
      "method": "GET"
    }
  }
}
```

## 🔗 API Gateway Setup (Optional)

### Create API Gateway

1. **Create REST API** or **HTTP API**
2. **Create Resource:** `/top-writers`
3. **Create Method:** GET
4. **Integration Type:** Lambda Function
5. **Lambda Function:** GetTopWriters
6. **Enable CORS**
7. **Deploy API**

### Test Endpoint

```bash
curl https://your-api-id.execute-api.me-central-1.amazonaws.com/stage/top-writers
```

## 📊 Expected Response

```json
{
  "success": true,
  "data": {
    "writers": [
      {
        "id": 1,
        "username": "writer1",
        "displayName": "Writer One",
        "articlesCount": 25,
        "readersCount": 5000,
        ...
      }
    ],
    "count": 3,
    "timestamp": "2025-10-30T12:00:00.000Z"
  }
}
```

## 🐛 Common Issues

### Issue: Module not found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
./deploy.sh
```

### Issue: Permission denied

```bash
# Fix permissions
chmod +x deploy.sh
```

### Issue: No writers returned

1. Check database has active users
2. Verify articles have views tracked
3. Check CloudWatch logs for errors

## 📝 Next Steps

1. ✅ Lambda deployed
2. ⏭️ Set up API Gateway endpoint
3. ⏭️ Integrate with frontend
4. ⏭️ Set up CloudWatch alarms
5. ⏭️ Test with production data

## 🎉 Done!

Your Lambda function is now deployed and ready to use!

For detailed documentation, see [README.md](./README.md)

---

**Quick Links:**
- [Full README](./README.md)
- [Test Script](./test-local.js)
- [Deploy Script](./deploy.sh)
