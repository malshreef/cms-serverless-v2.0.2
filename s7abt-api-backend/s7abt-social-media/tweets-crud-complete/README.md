# Tweets CRUD Lambda Functions

Complete CRUD operations for S7abt tweets management using DynamoDB.

## 📦 Package Contents

### Lambda Functions:
1. **list/** - GET `/admin/tweets` - List all tweets with filtering
2. **delete/** - DELETE `/admin/tweets/{id}` - Delete a tweet
3. **approve/** - POST `/admin/tweets/{id}/approve` - Approve a tweet
4. **publish/** - POST `/admin/tweets/{id}/publish` - Publish immediately

### Scripts:
- **deploy-all.sh** - Deploy all Lambda functions
- **setup-api-gateway.sh** - Create API Gateway resources and methods
- **package.json** - Dependencies for all functions

---

## 🚀 Quick Deployment (3 Steps)

### Step 1: Deploy Lambda Functions

```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

This will:
- Install dependencies
- Create 4 Lambda functions
- Configure environment variables

### Step 2: Setup API Gateway

```bash
chmod +x setup-api-gateway.sh
./setup-api-gateway.sh
```

This will:
- Create `/admin/tweets` resource
- Create `/admin/tweets/{id}` resource
- Create `/admin/tweets/{id}/approve` resource
- Create `/admin/tweets/{id}/publish` resource
- Add GET, DELETE, POST methods
- Enable CORS
- Deploy API

### Step 3: Test

```bash
# List tweets
curl -X GET https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/tweets \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete tweet
curl -X DELETE https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/tweets/123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Publish tweet
curl -X POST https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/tweets/123/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/tweets` | List all tweets |
| DELETE | `/admin/tweets/{id}` | Delete a tweet |
| POST | `/admin/tweets/{id}/approve` | Approve a tweet |
| POST | `/admin/tweets/{id}/publish` | Publish immediately |

### Query Parameters (GET /admin/tweets):

- `status` - Filter by status (pending, posted, failed, all)
- `search` - Search in tweet text and article title
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

---

## 🗄️ DynamoDB Table

**Table Name**: `s7abt-tweet-queue-dev`

**Schema**:
- Primary Key: `tweet_id` (String)
- Attributes: `status`, `scheduled_time`, `article_id`, `tweet_text`, `article_title`, `tone`, `sequence`, `hashtags`, `posted_time`, `twitter_tweet_id`

**GSI**:
- `status-scheduled_time-index` - Query by status and time
- `article_id-index` - Query tweets by article

---

## 🔧 Environment Variables

Each Lambda function uses:

```
TWEET_QUEUE_TABLE=s7abt-tweet-queue-dev
AWS_REGION=me-central-1
```

---

## 📝 Response Format

### Success Response:
```json
{
  "success": true,
  "data": {
    "tweets": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## 🧪 Testing Checklist

- [ ] List all tweets
- [ ] Filter by status (pending, posted, failed)
- [ ] Search tweets
- [ ] Delete tweet
- [ ] Approve tweet
- [ ] Publish tweet immediately
- [ ] CORS works from frontend
- [ ] Pagination works

---

## 🔐 IAM Permissions Required

The Lambda execution role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:me-central-1:<your-aws-account-id>:table/s7abt-tweet-queue-dev",
        "arn:aws:dynamodb:me-central-1:<your-aws-account-id>:table/s7abt-tweet-queue-dev/index/*"
      ]
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Lambda not found error:
- Check if Lambda functions are created
- Verify function names match the script

### CORS error:
- Run `setup-api-gateway.sh` again
- Check OPTIONS method exists
- Verify Access-Control-Allow-Origin header

### 403 Unauthorized:
- Check Cognito token is valid
- Verify authorizer is configured
- Check token expiration

### DynamoDB access denied:
- Verify IAM role has DynamoDB permissions
- Check table name is correct
- Verify region matches

---

## 📚 Related Files

- Frontend: `Tweets.jsx` - Uses these APIs
- Backend: `tweet-generator/` - Generates tweets
- Backend: `tweet-publisher/` - Publishes to Twitter

---

All set! Deploy and test! 🚀

