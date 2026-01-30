# Get Top Writers Lambda Function

Lambda function to fetch the top 3 writers from S7abt platform based on total article views.

## 📋 Table of Contents

- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This Lambda function:
- Fetches top 3 writers ranked by total article views
- Includes writer metadata (name, bio, social media links)
- Returns article count and reader count per writer
- Follows S7abt Lambda architecture with shared/db.js module
- Uses AWS Secrets Manager for database credentials

## 📁 Folder Structure

```
lambda-get-top-writers/
├── get-writers.js              # Main Lambda handler
├── shared/                     # Shared modules
│   └── db.js                  # Database connection module
├── package.json               # Dependencies
├── test-local.js              # Local testing script
├── deploy.sh                  # Deployment script
├── README.md                  # This file
└── node_modules/              # Dependencies (after npm install)
```

**This matches your S7abt Lambda structure:**
```
S7ABT-ADMIN-CREATE-ARTICLE-DEV/
├── create.js      ← Handler at root
├── shared/        ← Shared modules
│   └── db.js     ← Database connection
└── node_modules/
```

## ✅ Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18.x or higher
- npm installed
- AWS Lambda execution role with permissions:
  - `secretsmanager:GetSecretValue`
  - `logs:CreateLogGroup`
  - `logs:CreateLogStream`
  - `logs:PutLogEvents`
- Database credentials stored in AWS Secrets Manager

## 📦 Installation

```bash
# Clone or download the Lambda function
cd lambda-get-top-writers

# Install dependencies
npm install
```

## ⚙️ Configuration

### 1. Environment Variables

Set these in Lambda Console → Configuration → Environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_SECRET_ARN` | ARN of database credentials in Secrets Manager | `arn:aws:secretsmanager:me-central-1:123456789012:secret:s7abt-db-creds` |
| `AWS_REGION` | AWS region | `me-central-1` |

### 2. Secrets Manager

Your database secret should contain:

```json
{
  "host": "your-db-host.rds.amazonaws.com",
  "username": "your_username",
  "password": "your_password",
  "dbname": "s7abt_db",
  "port": 3306
}
```

### 3. Lambda Configuration

- **Runtime:** Node.js 18.x
- **Handler:** `get-writers.handler`
- **Memory:** 256 MB (recommended)
- **Timeout:** 30 seconds
- **Architecture:** x86_64 or arm64

## 🚀 Deployment

### Automated Deployment (Recommended)

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Manual Deployment

```bash
# Install dependencies (production only)
npm install --production

# Create deployment package
zip -r function.zip get-writers.js shared/ node_modules/

# Upload to Lambda (if function exists)
aws lambda update-function-code \
  --function-name GetTopWriters \
  --zip-file fileb://function.zip \
  --region me-central-1

# Or create new function
aws lambda create-function \
  --function-name GetTopWriters \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_LAMBDA_ROLE \
  --handler get-writers.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --region me-central-1
```

## 🧪 Testing

### Local Testing

```bash
# Set environment variables
export DB_SECRET_ARN="arn:aws:secretsmanager:me-central-1:123456789012:secret:s7abt-db"
export AWS_REGION="me-central-1"

# Run test
node test-local.js
```

### Lambda Console Testing

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

### CLI Testing

```bash
# Invoke function
aws lambda invoke \
  --function-name GetTopWriters \
  --region me-central-1 \
  response.json

# View response
cat response.json | jq
```

### API Gateway Testing

```bash
# Test GET request
curl -X GET "https://your-api-id.execute-api.me-central-1.amazonaws.com/stage/top-writers"

# Test CORS
curl -X OPTIONS "https://your-api-id.execute-api.me-central-1.amazonaws.com/stage/top-writers" \
  -H "Origin: https://s7abt.com"
```

## 📊 API Reference

### Request

```
GET /top-writers
```

**Headers:**
- `Content-Type: application/json` (optional)

**Query Parameters:** None

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "writers": [
      {
        "id": 1,
        "username": "malshreef",
        "displayName": "محمد الشريف",
        "bio": "خبير في تقنيات الحوسبة السحابية والذكاء الاصطناعي",
        "articlesCount": 25,
        "readersCount": 5000,
        "avatarUrl": "https://<your-s3-bucket>.s3.me-central-1.amazonaws.com/avatars/user-1.jpg",
        "socialMedia": {
          "twitter": "malshreef",
          "linkedin": "malshreef",
          "instagram": "malshreef",
          "website": "https://malshreef.com"
        }
      },
      {
        "id": 2,
        "username": "sara_writer",
        "displayName": "سارة الكاتبة",
        "bio": "كاتبة ومدونة تقنية",
        "articlesCount": 18,
        "readersCount": 3500,
        "avatarUrl": "https://<your-s3-bucket>.s3.me-central-1.amazonaws.com/avatars/user-2.jpg",
        "socialMedia": {
          "twitter": "sara_writer",
          "linkedin": null,
          "instagram": "sara_writer",
          "website": null
        }
      },
      {
        "id": 3,
        "username": "tech_ahmed",
        "displayName": "أحمد التقني",
        "bio": "مطور برمجيات ومهندس حلول",
        "articlesCount": 22,
        "readersCount": 3200,
        "avatarUrl": null,
        "socialMedia": {
          "twitter": "tech_ahmed",
          "linkedin": "tech-ahmed",
          "instagram": null,
          "website": "https://ahmed.tech"
        }
      }
    ],
    "count": 3,
    "timestamp": "2025-10-30T12:00:00.000Z"
  }
}
```

### Error Response (500)

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to fetch top writers"
}
```

**Note:** In development mode (`NODE_ENV=development`), detailed error messages are included.

## 🗄️ Database Schema

### Required Tables

**s7b_user:**
- `s7b_user_id` (INT) - Primary key
- `s7b_user_username` (VARCHAR) - Username
- `s7b_user_name` (VARCHAR) - Display name
- `s7b_user_bio` (TEXT) - Biography
- `s7b_user_avatar` (VARCHAR) - Avatar URL
- `s7b_user_twitter` (VARCHAR) - Twitter handle
- `s7b_user_linkedin` (VARCHAR) - LinkedIn profile
- `s7b_user_instagram` (VARCHAR) - Instagram handle
- `s7b_user_website` (VARCHAR) - Personal website
- `s7b_user_active` (TINYINT) - Active status (1 = active)

**s7b_article:**
- `s7b_article_id` (INT) - Primary key
- `s7b_article_author` (INT) - Foreign key to s7b_user_id
- `s7b_article_views` (INT) - Number of views
- `s7b_article_active` (TINYINT) - Active status (1 = published)

### SQL Query Logic

The function ranks writers by:
1. **Total article views** (primary metric)
2. **Number of active articles** (secondary)
3. Only **active users** (`s7b_user_active = 1`)
4. Only **published articles** (`s7b_article_active = 1`)
5. Returns **top 3 writers** only

## 🐛 Troubleshooting

### Issue: "Cannot find module './shared/db'"

**Cause:** Missing `shared/` folder in deployment package

**Solution:**
```bash
# Verify ZIP contents
unzip -l function.zip | grep shared

# Ensure shared/ is included when zipping
zip -r function.zip get-writers.js shared/ node_modules/
```

### Issue: "Failed to retrieve database credentials"

**Cause:** Missing or incorrect `DB_SECRET_ARN` environment variable

**Solution:**
1. Verify secret exists in Secrets Manager
2. Check Lambda has permission to access secret
3. Verify `DB_SECRET_ARN` is set correctly in Lambda environment variables

### Issue: "Connection timeout"

**Cause:** Lambda cannot reach database

**Solution:**
1. Ensure Lambda is in same VPC as database (if using VPC)
2. Check security groups allow traffic on port 3306
3. Verify database is running and accessible

### Issue: "Empty response / No writers found"

**Cause:** No active users with published articles

**Solution:**
1. Check database has active users (`s7b_user_active = 1`)
2. Verify users have published articles (`s7b_article_active = 1`)
3. Check article views are being tracked

## 📝 Logs

View logs in CloudWatch:

```bash
# Tail logs
aws logs tail /aws/lambda/GetTopWriters --follow --region me-central-1

# Filter errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/GetTopWriters \
  --filter-pattern "ERROR" \
  --region me-central-1
```

## 🔐 Security Best Practices

✅ **Implemented:**
- Credentials stored in Secrets Manager
- No hardcoded passwords
- CORS headers configured
- Connection cleanup in finally block
- Error messages sanitized in production
- Parameterized queries (SQL injection protection)

📝 **Recommended:**
- Restrict CORS to specific domain in production
- Enable API Gateway throttling
- Set up CloudWatch alarms for errors
- Regular security audits
- Use VPC for database isolation

## 📊 Monitoring

### CloudWatch Metrics

Monitor:
- **Invocations** - Number of function calls
- **Duration** - Execution time
- **Errors** - Failed invocations
- **Throttles** - Rate limit hits

### CloudWatch Alarms

Set up alarms for:
- Error rate > 5%
- Duration > 10 seconds
- Throttles > 0

## 🤝 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review CloudWatch logs
3. Verify configuration settings

## 📄 License

ISC License - S7abt Team

---

**Version:** 1.0.0  
**Last Updated:** October 30, 2025  
**Maintainer:** S7abt Development Team
